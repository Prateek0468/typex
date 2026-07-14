package websocket

import (
	"encoding/json"
	"sync"

	"typex-server/internal/room"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn    *websocket.Conn
	roomID  string
	racerID string
	writeMu sync.Mutex
}

type Hub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]*Client
	store   *room.MemoryStore
}

type ClientMessage struct {
	Type            string     `json:"type"`
	RoomID          string     `json:"roomId"`
	Racer           room.Racer `json:"racer"`
	Text            string     `json:"text"`
	DurationSeconds int        `json:"durationSeconds"`
}

type ServerMessage struct {
	Type     string            `json:"type"`
	RoomID   string            `json:"roomId"`
	Racer    room.Racer        `json:"racer,omitempty"`
	Snapshot room.RoomSnapshot `json:"snapshot,omitempty"`
	Message  string            `json:"message,omitempty"`
}

func NewHub(store *room.MemoryStore) *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]*Client),
		store:   store,
	}
}

func (h *Hub) Add(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[conn] = &Client{conn: conn}
}

func (h *Hub) Remove(conn *websocket.Conn) {
	var roomID string
	var racerID string

	h.mu.Lock()
	client := h.clients[conn]
	if client != nil {
		roomID = client.roomID
		racerID = client.racerID
	}
	delete(h.clients, conn)
	h.mu.Unlock()

	if roomID != "" && racerID != "" {
		if snapshot, ok := h.store.LeaveRoom(roomID, racerID); ok {
			h.broadcastToRoom(roomID, ServerMessage{
				Type:     "snapshot",
				RoomID:   roomID,
				Snapshot: snapshot,
			})
		}
	}

	conn.Close()
}

func (h *Hub) HandleMessage(conn *websocket.Conn, payload []byte) {
	var message ClientMessage
	if err := json.Unmarshal(payload, &message); err != nil {
		h.send(conn, ServerMessage{
			Type:    "error",
			Message: "invalid message",
		})
		return
	}

	switch message.Type {
	case "join":
		h.joinRoom(conn, message)
	case "start":
		h.startRace(message)
	case "reset":
		h.resetRace(message)
	case "progress", "finish":
		h.updateRacer(message)
	case "expire":
		h.finishExpiredRace(message.RoomID)
	}
}

func (h *Hub) joinRoom(conn *websocket.Conn, message ClientMessage) {
	snapshot, ok := h.store.JoinRoom(message.RoomID, message.Racer)
	if !ok {
		errorMessage := snapshot.Message
		if errorMessage == "" {
			errorMessage = "room not found or expired"
		}
		h.send(conn, ServerMessage{
			Type:    "error",
			RoomID:  message.RoomID,
			Message: errorMessage,
		})
		return
	}

	h.mu.Lock()
	if client := h.clients[conn]; client != nil {
		client.roomID = snapshot.Room.ID
		client.racerID = message.Racer.ID
	}
	h.mu.Unlock()

	h.broadcastToRoom(snapshot.Room.ID, ServerMessage{
		Type:     "snapshot",
		RoomID:   snapshot.Room.ID,
		Snapshot: snapshot,
	})
}

func (h *Hub) startRace(message ClientMessage) {
	snapshot, ok := h.store.StartRace(
		message.RoomID,
		message.Text,
		message.DurationSeconds,
	)
	if !ok {
		return
	}

	h.broadcastToRoom(snapshot.Room.ID, ServerMessage{
		Type:     "snapshot",
		RoomID:   snapshot.Room.ID,
		Snapshot: snapshot,
	})
}

func (h *Hub) resetRace(message ClientMessage) {
	snapshot, ok := h.store.ResetRace(message.RoomID, message.Text)
	if !ok {
		return
	}

	h.broadcastToRoom(snapshot.Room.ID, ServerMessage{
		Type:     "snapshot",
		RoomID:   snapshot.Room.ID,
		Snapshot: snapshot,
	})
}

func (h *Hub) updateRacer(message ClientMessage) {
	snapshot, ok := h.store.UpdateRacer(message.RoomID, message.Racer)
	if !ok {
		return
	}

	h.broadcastToRoom(snapshot.Room.ID, ServerMessage{
		Type:     "snapshot",
		RoomID:   snapshot.Room.ID,
		Snapshot: snapshot,
	})
}

func (h *Hub) finishExpiredRace(roomID string) {
	snapshot, ok := h.store.FinishExpiredRace(roomID)
	if !ok {
		return
	}

	h.broadcastToRoom(snapshot.Room.ID, ServerMessage{
		Type:     "snapshot",
		RoomID:   snapshot.Room.ID,
		Snapshot: snapshot,
	})
}

func (h *Hub) broadcastToRoom(roomID string, message ServerMessage) {
	h.mu.Lock()
	targets := make([]*Client, 0)
	for _, client := range h.clients {
		if client.roomID == roomID {
			targets = append(targets, client)
		}
	}
	h.mu.Unlock()

	for _, client := range targets {
		h.send(client.conn, message)
	}
}

func (h *Hub) send(conn *websocket.Conn, message ServerMessage) {
	payload, err := json.Marshal(message)
	if err != nil {
		return
	}

	h.mu.Lock()
	client := h.clients[conn]
	h.mu.Unlock()
	if client == nil {
		return
	}

	client.writeMu.Lock()
	defer client.writeMu.Unlock()

	if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
		h.Remove(conn)
	}
}
