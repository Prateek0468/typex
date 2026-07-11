package websocket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Handle(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		if !hub.Add(conn) {
			conn.WriteMessage(websocket.TextMessage, []byte("Lobby full"))
			conn.Close()
			return
		}

		defer hub.Remove(conn)

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			hub.Broadcast(conn, msg)
		}
	}
}