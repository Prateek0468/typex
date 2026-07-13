package room

import "time"

type RoomStatus string

const (
	StatusWaiting RoomStatus = "waiting"
	StatusRacing  RoomStatus = "racing"
	StatusFinished RoomStatus = "finished"
)

type Room struct {
	ID         string
	HostID     string
	Status     RoomStatus // waiting, racing, finished
	MaxPlayers int
	CreatedAt  time.Time
}
