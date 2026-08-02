package websocket

import (
	"encoding/json"
	"sync"

	"typex-server/internal/room"

	"github.com/gorilla/websocket"
)

// hub.go implements the in-memory coordination layer for all active race sockets.
//
// Why this file exists:
//   - The application needs a central place to remember which sockets belong to which
//     room and which racer, and to broadcast state changes to all peers in the same
//     race room.
//   - This file translates client messages into room-store mutations and then emits a
//     room snapshot back to the connected audience.
//
// Why it is necessary:
//   - A real-time multiplayer race cannot be implemented safely by sending REST
//     requests from each client and hoping the server state stays consistent.
//   - The hub keeps the connection registry, message routing, and per-client state in
//     one place so joins, progress updates, resets, and expirations can be handled
//     consistently.
//
// Alternatives:
//   - A message broker such as Redis Pub/Sub or NATS for cross-process fan-out.
//   - Per-room goroutines that maintain their own state and socket loops.
//   - A fully stateless REST-only architecture, which would not give the low-latency
//     feedback loop that typing races require.

// Client is the server-side view of one connected browser session.
//
// It stores the actual socket, the room it is currently joined to, and the racer
// identity that will be used when the room store updates the race snapshot.
type Client struct {
	conn    *websocket.Conn
	roomID  string
	racerID string
	writeMu sync.Mutex
}

// Hub is the registry and dispatcher for all live WebSocket clients.
//
// It keeps the connection map protected by a mutex so that message delivery and
// disconnect cleanup do not race each other. The room store is the source of truth
// for the current game state.
type Hub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]*Client
	store   *room.MemoryStore
}

// ClientMessage describes the payload that a browser sends over the socket.
//
// The client sends action-oriented events such as join, start, reset, progress,
// finish, and expire. Each action carries enough information for the hub to mutate
// the room or to identify the relevant racer.
type ClientMessage struct {
	Type            string     `json:"type"`
	RoomID          string     `json:"roomId"`
	Racer           room.Racer `json:"racer"`
	Text            string     `json:"text"`
	DurationSeconds int        `json:"durationSeconds"`
}

// ServerMessage is the response payload the server pushes back to subscribers.
//
// A snapshot is the usual response because the client can be rendered from a
// normalized room state rather than trying to infer state transitions incrementally.
type ServerMessage struct {
	Type     string            `json:"type"`
	RoomID   string            `json:"roomId"`
	Racer    room.Racer        `json:"racer,omitempty"`
	Snapshot room.RoomSnapshot `json:"snapshot,omitempty"`
	Message  string            `json:"message,omitempty"`
}

// NewHub builds the in-memory realtime router that connects sockets to the room
// store. It is the composition point between the transport layer and the domain
// model.
func NewHub(store *room.MemoryStore) *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]*Client),
		store:   store,
	}
}

// Add registers a fresh socket connection with the hub.
//
// The connection is stored before the client has declared its room or racer, because
// the first received payload will complete that association. This is important to
// keep connection bookkeeping and message routing in sync.
func (h *Hub) Add(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[conn] = &Client{conn: conn}
}

// Remove disconnects a socket and cleans up any room membership it had.
//
// If the client had already joined a room, the room store is asked to leave that
// room and a final snapshot is broadcast so other racers can see the updated state.
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

// HandleMessage parses one incoming payload and dispatches it to the correct
// action handler.
//
// This keeps all message interpretation in one place, which is easier to reason
// about than scattering the switch logic across the handler and callback layer.
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

// joinRoom connects a browser session to a room and publishes the resulting
// snapshot to every currently connected participant in that room.
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

// startRace begins a new race in the room and fan-outs the new snapshot so all
// clients see the exact same starting state.
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

// resetRace clears the current race state and distributes the latest snapshot.
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

// updateRacer records the latest progress or finish signal for one racer and then
// pushes a room-wide snapshot so everyone sees the new ranking or completion state.
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

// finishExpiredRace resolves a timed-out race and broadcasts the final state.
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

// broadcastToRoom fans a message out to every connected client that belongs to the
// supplied room. This is the hub's core realtime delivery primitive.
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

// send encodes a server-side message into JSON and writes it to one socket.
//
// It is designed to be safe against concurrent writes by guarding each client's
// write operations with a mutex. If the socket is already dead, the hub removes the
// connection as part of cleanup.
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
