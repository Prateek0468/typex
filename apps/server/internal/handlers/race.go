package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"typex-server/internal/utils"
)

type FinishRaceRequest struct {
	WPM      int `json:"wpm"`
	Accuracy int `json:"accuracy"`
}

func (h *Handler) FinishRace(w http.ResponseWriter, r *http.Request) {
	// get user id from auth middleware
	fmt.Println("finish race hit")
	userID := r.Context().Value("userID").(string)
	fmt.Println("userID:", userID)


	var req FinishRaceRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
		return
	}

	err = h.userRepo.UpdateUserStats(
		r.Context(),
		userID,
		req.WPM,
		req.Accuracy,
	)

	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "race recorded",
	})
}