package handlers

import (
	"encoding/json"
	"net/http"

	"typex-server/internal/auth"
	"typex-server/internal/user"
	"typex-server/internal/utils"

	"golang.org/x/crypto/bcrypt"
)


type Handler struct {
	userRepo *user.Repository
}

func NewHandler(userRepo *user.Repository) *Handler {
		return &Handler{userRepo: userRepo}
}

// not putting it in a separate model.go because it belongs to the domain, not the layer
// auth is not a data model layer. it is business logic around login/signup
type SignupRequest struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Signup Handler
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	// only allow post
	if r.Method != http.MethodPost{
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	
	// decode JSON body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// basic validation
	if req.Email == "" || req.Password == "" || req.Name == "" {
		http.Error(w, "missing fields", http.StatusBadRequest)
		return
	}

	// TEMP: storing raw password for now (we will fix with bcrypt next)
	err := h.userRepo.CreateUser(r.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		if err.Error() == "email already exists" {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	// w.Write([]byte("user created"))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
	"message": "user created",
	})
}

// Login handler
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	// check if method is post and only allow that
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, map[string] string{
			"error": "method not allowed",
		})
		return
	}

	var req LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string] string{
			"error": "invalid request body",
		})
		return
	}


	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, map[string] string{
			"error": "invalid credentials",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	)
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, map[string] string{
			"error": "invalid credentials",
		})
		return
	}


	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to generate token",
		})

		return
	}

	http.SetCookie(w, &http.Cookie{
		Name: "token",
		Value: token, 
		HttpOnly: true,
		Path: "/",
		MaxAge: 60 * 60 * 24, // 1 day
		SameSite: http.SameSiteLaxMode,
	})

		utils.WriteJSON(w, http.StatusOK, map[string] string{
			"message": "login successful",
		})
}