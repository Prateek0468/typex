package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func New(connString string) (*pgxpool.Pool, error) {
	// this gives us full control. 
	// reads connection string and converts it into structured config object
	// config lets your tweak pool size, set timeouts, enable logging and tune performance
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}

	// you're explicitly building the pool with the config you created above
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	return pool, nil
}