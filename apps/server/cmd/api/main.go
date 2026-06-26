package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"typex-server/internal/db"
	"typex-server/internal/handlers"
	"typex-server/internal/user"

	"github.com/joho/godotenv"
)

// enable cors to talk to frontend
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")	
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	
	})
}

func main() {
	// set up a request multiplexer
	// routes incoming HTTP requests to the right handler based on the URL path
	mux := http.NewServeMux()

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

	userRepo := user.NewRepository(pool)
	handler := handlers.NewHandler(userRepo)


	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([] byte("server is running"))
	})
	mux.HandleFunc("/signup", handler.Signup)
	mux.HandleFunc("/login", handler.Login)
	mux.HandleFunc("/user", handler.User)

	corshandler := enableCors(mux)


	// verify connection
	if err := pool.Ping(context.Background()); err != nil {
		panic("db ping failed: " + err.Error())
	}
	fmt.Println("DB connected")

	fmt.Println("Server running on :8080")

	err1 := http.ListenAndServe(":8080", corshandler)
	if err1 != nil {
		panic(err)
	}
}