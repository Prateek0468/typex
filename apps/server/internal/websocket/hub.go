package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)


type Hub struct {
	mu sync.Mutex
	clients map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub {
		clients: make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) Add(conn *websocket.Conn) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.clients) >= 5 {
		return false
	}

	h.clients[conn] = true
	return true
}

func (h *Hub) Remove(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.clients, conn)
	conn.Close()
}


func (h *Hub) Broadcast(sender *websocket.Conn, message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for conn := range h.clients {
		if conn == sender {
			continue
		}

		conn.WriteMessage(websocket.TextMessage, message)
	}
} 