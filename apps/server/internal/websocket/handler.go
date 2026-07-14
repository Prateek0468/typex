package websocket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

// converts a normal HTTP conn to a websocket conn
var upgrader = websocket.Upgrader{

	// browsers block ws conn from diff origins so we allow every origin for dev purposes
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Handle(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// upgrade incoming http to websocket conn
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		// Store the connection first. The first client message decides which room it belongs to.
		hub.Add(conn)

		// when this func exists(disconnects, browser closes etc) auto remove the client
		defer hub.Remove(conn)

		// keep reading messages forever(until closed ofc)
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			hub.HandleMessage(conn, msg)
		}
	}
}
