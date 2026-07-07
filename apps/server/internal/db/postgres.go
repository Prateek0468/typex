package db

import (
	"context"

	"github.com/jackc/pgx/v5"
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

	// usual flow. 
	// 	Go
	//  ↓
	// pgx creates prepared statement
	//  ↓
	// Postgres stores it
	//  ↓
	// execute

	// flow after adding this line. It is slower but avoids prepared statements. We were getting an error so we added this for now.
	// 	Go
	//  ↓
	// send SQL directly
	//  ↓
	// Postgres executes
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol // TODO: remove this later. It's slower for repeated queries.

	// you're explicitly building the pool with the config you created above
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	return pool, nil
}