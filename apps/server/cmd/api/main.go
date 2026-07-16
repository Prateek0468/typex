package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"typex-server/internal/auth"
	"typex-server/internal/db"
	"typex-server/internal/handlers"
	"typex-server/internal/room"
	"typex-server/internal/user"
	"typex-server/internal/websocket"

	"github.com/joho/godotenv"
)

// enable cors to talk to frontend
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigins := map[string]bool{
			"http://localhost:3000": true,
			"https://typex-web-snowy.vercel.app": true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

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

	// Keep active race rooms in memory for the MVP.
	// This gives the websocket hub and HTTP room handlers the same source of truth.
	roomStore := room.NewMemoryStore()

	//create websocket hub
	hub := websocket.NewHub(roomStore)

	// load env file
	err := godotenv.Load()
	if err != nil {
			log.Println("No .env file found, using environment variables") // local machine loads env and render will load it's own env so no panic here just print
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
	handler := handlers.NewHandler(userRepo, roomStore)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("server is running"))
	})
	mux.HandleFunc("/ws", websocket.Handle(hub))
	mux.HandleFunc("/signup", handler.Signup)
	mux.HandleFunc("/login", handler.Login)
	mux.HandleFunc("/logout", handler.Logout)
	mux.HandleFunc("/rooms", handler.Rooms)
	mux.HandleFunc("/rooms/", handler.RoomByID)
	mux.HandleFunc("/api/typing", handler.GetRandomText)
	mux.HandleFunc("/leaderboard", handler.Leaderboard)
	mux.Handle("/user", auth.AuthMiddleware(http.HandlerFunc(handler.User)))
	mux.Handle("/race/finish", auth.AuthMiddleware((http.HandlerFunc(handler.FinishRace))))


	corshandler := enableCors(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // for local development
	}

	// verify connection
	if err := pool.Ping(context.Background()); err != nil {
		panic("db ping failed: " + err.Error())
	}
	fmt.Println("DB connected")

	fmt.Println("Server running on" + port)

	err1 := http.ListenAndServe(":"+port, corshandler)
	if err1 != nil {
		panic(err)
	}
}
