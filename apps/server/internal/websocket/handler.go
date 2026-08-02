package websocket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

// handler.go is the HTTP-to-WebSocket bridge for the real-time typing race feature.
//
// Why this file exists:
//   - Web browsers cannot speak a persistent full-duplex socket directly through the
//     normal HTTP handler layer, so this file upgrades an incoming HTTP request into
//     a WebSocket connection.
//   - Once upgraded, the server can push live room snapshots to all connected racers
//     and receive incremental typing/progress events without forcing the client to
//     poll continuously.
//
// Why it is necessary:
//   - The race experience needs instant room synchronization, such as join events,
//     text changes, start/reset actions, and finish notifications.
//   - A single persistent connection is more efficient than repeatedly opening REST
//     endpoints for every keystroke or every room state mutation.
//
// Alternatives:
//   - Server-Sent Events (SSE) for one-way updates from server to client.
//   - Long polling, where the client repeatedly asks the server for new state.
//   - REST endpoints only, if the product could tolerate delayed updates and more
//     request overhead.

// Upgrader converts a normal HTTP request into a WebSocket connection.
//
// CheckOrigin is relaxed to true because this project is in local development and the
// frontend and backend may be served from different ports/origins during development.
var upgrader = websocket.Upgrader{

	// browsers block ws conn from diff origins so we allow every origin for dev purposes
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Handle is the HTTP endpoint that accepts the client connection and hands the
// lifecycle over to the Hub.
//
// Why this function exists:
//   - It is the boundary where a browser request becomes a persistent, bidirectional
//     socket session.
//   - It keeps the read loop alive until the client disconnects, which means the
//     server can keep processing real-time events from that racer.
//
// Why it is necessary:
//   - The hub cannot receive messages unless there is a live socket connection.
//   - This loop is the central read side of the realtime pipeline.
//
// Alternatives:
//   - A different transport implementation such as SSE or HTTP polling, which would
//     require a different read loop and message delivery strategy.
//   - A message broker or pub/sub layer that would sit above or instead of this local
//     per-process socket adapter.
func Handle(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// Upgrade the incoming HTTP request to a long-lived WebSocket connection.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		// Register the fresh connection with the hub before any room-specific message is
		// decoded. The first client payload will typically identify the room and racer.
		hub.Add(conn)

		// Always clean up the client when the handler returns, which happens on socket
		// close, network failure, or server-side disconnect.
		defer hub.Remove(conn)

		// Read forever until the socket breaks. Every incoming payload is routed through
		// the hub's message dispatcher.
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			hub.HandleMessage(conn, msg)
		}
	}
}
