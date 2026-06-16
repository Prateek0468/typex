package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"typex-server/internal/db"
)

func main() {
	// set up a request multiplexer
	// routes incoming HTTP requests to the right handler based on the URL path
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([] byte("server is running"))
	})

	// load env file
	err := godotenv.Load();
	if err != nil {
		panic(".env file not found")
	}

	// get the database url
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		panic("DATABASE URL is not set")
	}

	// setup a connection pool
	pool, err := db.New(databaseURL)
	if err != nil {
		panic(err)
	}

	defer pool.Close()

	// verify connection
	if err := pool.Ping(context.Background()); err != nil {
		panic("db ping failed: " + err.Error())
	}
	fmt.Println("DB connected")

	fmt.Println("Server running on :8080")

	err1 := http.ListenAndServe(":8080", mux)
	if err1 != nil {
		panic(err)
	}
}