package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"typex-server/internal/auth"
	"typex-server/internal/db"
	"typex-server/internal/user"

	"github.com/joho/godotenv"
)

func main() {
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

	// set up a request multiplexer
	// routes incoming HTTP requests to the right handler based on the URL path
	mux := http.NewServeMux()
	userRepo := user.NewRepository(pool)
	authHandler := auth.NewHandler(userRepo)


	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([] byte("server is running"))
	})
	mux.HandleFunc("/signup", authHandler.Signup)
	mux.HandleFunc("/login", authHandler.Login)

	// verify connection
	if err := pool.Ping(context.Background()); err != nil {
		panic("db ping failed: " + err.Error())
	}
	fmt.Println("DB connected")

	fmt.Println("Server running on :8080")

	err1 := http.ListenAndServe(":8080", mux)
	if err1 != nil {
		panic(err1)
	}
}