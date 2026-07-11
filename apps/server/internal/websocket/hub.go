package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)


// represents our global lobby
// keeps track of every connected websocket client
type Hub struct {
	// mutex prevents multiple go routines from modifying the clients map at the same time
	mu sync.Mutex
	// every connected client is stored here
	clients map[*websocket.Conn]bool
}

// create a new hub
func NewHub() *Hub {
	return &Hub {
		clients: make(map[*websocket.Conn]bool),
	}
}

// this register a new client
// returns false if the lobby is already full
func (h *Hub) Add(conn *websocket.Conn) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	// checks the no. of clients in the lobby
	if len(h.clients) >= 5 {
		return false
	}

	h.clients[conn] = true
	return true
}

// this unregisters a client and closes the conn
func (h *Hub) Remove(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.clients, conn)
	conn.Close()
}


// sends a message to everyone except the sender
func (h *Hub) Broadcast(sender *websocket.Conn, message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for conn := range h.clients {
		// don't send message b ack to the person
		if conn == sender {
			continue
		}

		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			// if writing fails, remove the dead connection
			delete(h.clients, conn)
			conn.Close()
		}
	}
} 