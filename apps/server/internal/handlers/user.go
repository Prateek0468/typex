package handlers

import (
	"net/http"

	"typex-server/internal/auth"
	"typex-server/internal/utils"
)

func (h *Handler) User(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("token")
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, map[string]string {
			"error": "not logged in",
		})
		return
	}

	claims, err := auth.ValidateToken(cookie.Value)
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, map[string]string {
			"error": "invalid token",
		})
		return
	}

	user, err := h.userRepo.GetById(r.Context(), claims.UserID)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string {
			"error": "user not found",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string {
		"id": user.ID,
		"name": user.Name,
		"email": user.Email,
	})
}

func (h *Handler) Leaderboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	limit := 20
	page:= 1

	offset := (page - 1) * limit
	users, err := h.userRepo.GetAllUserStats(ctx, limit, offset)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string {
			"error": err.Error(),
		})
		return 
	}

	utils.WriteJSON(w, http.StatusOK, users)
}
