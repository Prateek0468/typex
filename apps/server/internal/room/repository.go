package room

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}


func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateRoom(ctx context.Context, hostID string) (*Room, error) {
	room := &Room {
		ID: uuid.NewString(),
		HostID: hostID,
		Status: StatusWaiting,
		MaxPlayers: 5,
		CreatedAt: time.Now(),
	}

	_, err := r.db.Exec(
		ctx, 
		`INSERT INTO rooms
				(id, host_id, status, max_players, created_at)
		VALUES 
				($1, $2, $3, $4, $5)`, room.ID, room.HostID, room.Status, room.MaxPlayers, room.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return room, nil
}

// returns a room by ID
func (r *Repository) GetRoom(ctx context.Context, roomID string) (*Room, error) {
	var room Room
	
	err := r.db.QueryRow(
		ctx,
		`SELECT
			id,
			host_id,
			status,
			max_players,
			created_at
		FROM rooms
		WHERE id = $1`,
		roomID,
	).Scan(
		&room.ID,
		&room.HostID,
		&room.Status,
		&room.MaxPlayers,
		&room.CreatedAt,
	)


	if err != nil {
		return nil, err
	}

	return &room, nil
}

// RoomExists checks whether a room exists.
func (r *Repository) RoomExists(ctx context.Context, roomID string) (bool, error) {
	var exists bool

	err := r.db.QueryRow(
		ctx,
		`SELECT EXISTS(
			SELECT 1
			FROM rooms
			WHERE id = $1
		)`,
		roomID,
	).Scan(&exists)

	return exists, err
}
