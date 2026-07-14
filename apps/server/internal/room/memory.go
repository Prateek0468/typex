package room

import (
	"math/rand"
	"strings"
	"sync"
	"time"
)

const (
	DefaultRoomTTL     = 45 * time.Minute
	DefaultMaxPlayers  = 5
	GlobalRoomID       = "GLOBAL"
	defaultCodeLetters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	DefaultTypingText  = "The quick brown fox jumps over the lazy dog while every racer tries to stay calm, accurate, and fast until the timer ends."
)

type Racer struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Progress   float64 `json:"progress"`
	WPM        int     `json:"wpm"`
	Accuracy   int     `json:"accuracy"`
	Color      string  `json:"color"`
	FinishedAt int64   `json:"finishedAt,omitempty"`
}

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
	Racers          map[string]Racer `json:"racers"`
}

type RoomSnapshot struct {
	Room    LiveRoom `json:"room"`
	Racers  []Racer  `json:"racers"`
	Now     int64    `json:"now"`
	Message string   `json:"message,omitempty"`
}

type MemoryStore struct {
	mu    sync.Mutex
	rooms map[string]*LiveRoom
}

func NewMemoryStore() *MemoryStore {
	store := &MemoryStore{
		rooms: make(map[string]*LiveRoom),
	}

	store.ensureRoom(GlobalRoomID)
	go store.cleanupExpiredRooms()

	return store
}

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

func (s *MemoryStore) GetRoom(id string) (LiveRoom, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[normalizeRoomID(id)]
	if !ok {
		return LiveRoom{}, false
	}

	return *room, true
}

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

func racersFromRoom(room *LiveRoom) []Racer {
	racers := make([]Racer, 0, len(room.Racers))
	for _, racer := range room.Racers {
		racers = append(racers, racer)
	}

	return racers
}

func randomRoomCode() string {
	var builder strings.Builder
	for i := 0; i < 6; i++ {
		builder.WriteByte(defaultCodeLetters[rand.Intn(len(defaultCodeLetters))])
	}

	return builder.String()
}

func normalizeRoomID(id string) string {
	normalized := strings.TrimSpace(strings.ToUpper(id))
	if normalized == "" {
		return GlobalRoomID
	}

	return normalized
}

func normalizeRoomText(text string) string {
	trimmedText := strings.TrimSpace(text)
	if trimmedText == "" {
		return DefaultTypingText
	}

	return trimmedText
}

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
