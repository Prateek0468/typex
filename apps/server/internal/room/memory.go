package room

/*
This file is the in-memory store for live typing races.

Unlike repository.go, which persists room metadata in Postgres, MemoryStore
holds the ephemeral race state that changes many times per second: who is in
a room, each racer's WPM/progress, the prompt text, and countdown / finish
timestamps. The WebSocket hub reads and writes this store so every connected
client can be broadcast a consistent snapshot.

Rooms are keyed by a short uppercase code (or the reserved "GLOBAL" lobby).
Private rooms expire after DefaultRoomTTL of inactivity; the global room is
never deleted. All public methods take the mutex so concurrent WS handlers
cannot corrupt maps.
*/

import (
	"math/rand"
	"strings"
	"sync"
	"time"
)

const (
	// DefaultRoomTTL is how long a private room lives after creation, and also
	// the max idle time before cleanupExpiredRooms deletes it.
	DefaultRoomTTL = 45 * time.Minute
	// DefaultMaxPlayers is the join cap for a newly created LiveRoom.
	DefaultMaxPlayers = 5
	// GlobalRoomID is the always-present public lobby. Join with an empty or
	// missing room code and normalizeRoomID maps it here.
	GlobalRoomID = "GLOBAL"
	// defaultCodeLetters is the alphabet for 6-character private room codes.
	// Ambiguous characters (I, O, 0, 1) are omitted so codes are easier to read aloud.
	defaultCodeLetters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	// DefaultTypingText is used when CreateRoom / ensureRoom get an empty prompt.
	DefaultTypingText = "The quick brown fox jumps over the lazy dog while every racer tries to stay calm, accurate, and fast until the timer ends."
)

// Racer is one player inside a LiveRoom. The same struct is sent to clients
// as JSON, so field names stay camelCase.
type Racer struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Progress   float64 `json:"progress"`             // 0–1 (or 0–100 depending on client); fraction of text typed
	WPM        int     `json:"wpm"`
	Accuracy   int     `json:"accuracy"`
	Color      string  `json:"color"`                // UI accent so racers are distinguishable
	FinishedAt int64   `json:"finishedAt,omitempty"` // unix ms; zero until they complete the text
}

// LiveRoom is the full in-memory race document. Status comes from model.go
// (waiting / racing / finished). StartedAt is delayed 3s past StartRace so
// clients can show a countdown; EndsAt is StartedAt plus the race duration.
type LiveRoom struct {
	ID              string           `json:"id"`
	Status          RoomStatus       `json:"status"`
	MaxPlayers      int              `json:"maxPlayers"`
	CreatedAt       time.Time        `json:"createdAt"`
	ExpiresAt       time.Time        `json:"expiresAt"`
	LastActiveAt    time.Time        `json:"lastActiveAt"`
	Text            string           `json:"text"`
	StartedAt       int64            `json:"startedAt,omitempty"`
	EndsAt          int64            `json:"endsAt,omitempty"`
	DurationSeconds int              `json:"durationSeconds"`
	Racers          map[string]Racer `json:"racers"` // keyed by Racer.ID
}

// RoomSnapshot is what the hub broadcasts. Room is a copy of LiveRoom (the
// Racers map is still present on Room); Racers is a slice so JSON clients
// get a stable array. Now is server unix-ms so clients can sync clocks.
type RoomSnapshot struct {
	Room    LiveRoom `json:"room"`
	Racers  []Racer  `json:"racers"`
	Now     int64    `json:"now"`
	Message string   `json:"message,omitempty"` // set on failed JoinRoom when the room is full
}

// MemoryStore is a mutex-guarded map of room ID → LiveRoom.
type MemoryStore struct {
	mu    sync.Mutex
	rooms map[string]*LiveRoom
}

// NewMemoryStore creates the store, seeds the GLOBAL lobby, and starts a
// background goroutine that drops expired private rooms once a minute.
func NewMemoryStore() *MemoryStore {
	store := &MemoryStore{
		rooms: make(map[string]*LiveRoom),
	}

	store.ensureRoom(GlobalRoomID)
	go store.cleanupExpiredRooms()

	return store
}

// CreateRoom allocates a unique 6-character code, inserts a waiting room, and
// optionally overrides the default prompt. DurationSeconds is estimated from
// word count so the UI can show an expected race length before StartRace.
func (s *MemoryStore) CreateRoom(text string) LiveRoom {
	s.mu.Lock()
	defer s.mu.Unlock()

	for {
		id := randomRoomCode()
		if _, exists := s.rooms[id]; exists {
			continue
		}

		room := s.ensureRoom(id)
		room.Text = normalizeRoomText(text)
		room.DurationSeconds = estimateRaceSeconds(room.Text)
		return *room
	}
}

// GetRoom returns a copy of the room (not a pointer) so callers cannot mutate
// store state without going through an update method. ok is false if missing.
func (s *MemoryStore) GetRoom(id string) (LiveRoom, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return LiveRoom{}, false
	}

	return *room, true
}

// Snapshot is GetRoom plus a flattened racer list and a server clock reading.
func (s *MemoryStore) Snapshot(id string) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// JoinRoom upserts a racer. If they are new and the room is already at
// MaxPlayers, it returns the current snapshot with Message "room is full"
// and ok=false so the hub can reject the socket without mutating membership.
func (s *MemoryStore) JoinRoom(id string, racer Racer) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	if _, alreadyJoined := room.Racers[racer.ID]; !alreadyJoined && len(room.Racers) >= room.MaxPlayers {
		return RoomSnapshot{
			Room:    *room,
			Racers:  racersFromRoom(room),
			Now:     time.Now().UnixMilli(),
			Message: "room is full",
		}, false
	}

	room.Racers[racer.ID] = racer
	room.LastActiveAt = time.Now()

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// LeaveRoom removes a racer by ID. Missing rooms return ok=false; missing
// racers are a no-op delete.
func (s *MemoryStore) LeaveRoom(id string, racerID string) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	delete(room.Racers, racerID)
	room.LastActiveAt = time.Now()

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// UpdateRacer replaces a player's live stats (progress, WPM, accuracy, finish).
// It does not check MaxPlayers; callers should JoinRoom first.
func (s *MemoryStore) UpdateRacer(id string, racer Racer) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	room.Racers[racer.ID] = racer
	room.LastActiveAt = time.Now()

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// StartRace moves the room to StatusRacing. durationSeconds is clamped to
// [20, 180]. Typing actually begins 3 seconds after this call (StartedAt);
// EndsAt is that start plus duration so the extra 3s is a countdown, not race time.
func (s *MemoryStore) StartRace(id string, text string, durationSeconds int) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	now := time.Now()
	if durationSeconds < 20 {
		durationSeconds = 20
	}
	if durationSeconds > 180 {
		durationSeconds = 180
	}

	room.Text = text
	room.Status = StatusRacing
	room.StartedAt = now.Add(3 * time.Second).UnixMilli()
	room.EndsAt = now.Add(time.Duration(durationSeconds+3) * time.Second).UnixMilli()
	room.DurationSeconds = durationSeconds
	room.LastActiveAt = now

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    now.UnixMilli(),
	}, true
}

// ResetRace returns the room to waiting with a new prompt, clears start/end
// timestamps, and zeroes every racer's progress so a rematch can start clean.
func (s *MemoryStore) ResetRace(id string, text string) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	room.Text = text
	room.Status = StatusWaiting
	room.StartedAt = 0
	room.EndsAt = 0
	room.DurationSeconds = estimateRaceSeconds(text)
	room.LastActiveAt = time.Now()

	for racerID, racer := range room.Racers {
		racer.Progress = 0
		racer.WPM = 0
		racer.Accuracy = 100
		racer.FinishedAt = 0
		room.Racers[racerID] = racer
	}

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// FinishExpiredRace is a lazy ticker: if the room is still StatusRacing and
// the wall clock has passed EndsAt, it flips StatusFinished. Safe to call
// often from the hub; it is a no-op when the race is not over.
func (s *MemoryStore) FinishExpiredRace(id string) (RoomSnapshot, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return RoomSnapshot{}, false
	}

	if room.Status == StatusRacing && room.EndsAt > 0 && time.Now().UnixMilli() >= room.EndsAt {
		room.Status = StatusFinished
		room.LastActiveAt = time.Now()
	}

	return RoomSnapshot{
		Room:   *room,
		Racers: racersFromRoom(room),
		Now:    time.Now().UnixMilli(),
	}, true
}

// ensureRoom returns the existing room or inserts a waiting room with defaults.
// Caller must already hold s.mu (except NewMemoryStore, which is single-threaded
// until the cleanup goroutine starts).
func (s *MemoryStore) ensureRoom(id string) *LiveRoom {
	normalizedID := normalizeRoomID(id)

	if room, exists := s.rooms[normalizedID]; exists {
		return room
	}

	now := time.Now()
	room := &LiveRoom{
		ID:              normalizedID,
		Status:          StatusWaiting,
		MaxPlayers:      DefaultMaxPlayers,
		CreatedAt:       now,
		ExpiresAt:       now.Add(DefaultRoomTTL),
		LastActiveAt:    now,
		Text:            DefaultTypingText,
		DurationSeconds: estimateRaceSeconds(DefaultTypingText),
		Racers:          make(map[string]Racer),
	}
	s.rooms[normalizedID] = room

	return room
}

// cleanupExpiredRooms runs until process exit. GLOBAL is skipped. A private
// room is deleted if ExpiresAt has passed or it has been idle longer than TTL.
func (s *MemoryStore) cleanupExpiredRooms() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for id, room := range s.rooms {
			if id == GlobalRoomID {
				continue
			}
			if now.After(room.ExpiresAt) || now.Sub(room.LastActiveAt) > DefaultRoomTTL {
				delete(s.rooms, id)
			}
		}
		s.mu.Unlock()
	}
}

// racersFromRoom copies the map into a slice for JSON / broadcast.
func racersFromRoom(room *LiveRoom) []Racer {
	racers := make([]Racer, 0, len(room.Racers))
	for _, racer := range room.Racers {
		racers = append(racers, racer)
	}

	return racers
}

// randomRoomCode builds a 6-character ID from defaultCodeLetters.
func randomRoomCode() string {
	var builder strings.Builder
	for i := 0; i < 6; i++ {
		builder.WriteByte(defaultCodeLetters[rand.Intn(len(defaultCodeLetters))])
	}

	return builder.String()
}

// normalizeRoomID uppercases and trims the code. Empty input becomes GLOBAL
// so an unspecified room joins the public lobby.
func normalizeRoomID(id string) string {
	normalized := strings.TrimSpace(strings.ToUpper(id))
	if normalized == "" {
		return GlobalRoomID
	}

	return normalized
}

// normalizeRoomText falls back to DefaultTypingText when the host sent blank.
func normalizeRoomText(text string) string {
	trimmedText := strings.TrimSpace(text)
	if trimmedText == "" {
		return DefaultTypingText
	}

	return trimmedText
}

// estimateRaceSeconds sizes a waiting-room timer from prompt length, assuming
// ~45 WPM. Result is clamped to [30, 150] seconds.
func estimateRaceSeconds(text string) int {
	words := len(strings.Fields(text))
	seconds := words * 60 / 45
	if seconds < 30 {
		return 30
	}
	if seconds > 150 {
		return 150
	}

	return seconds
}
