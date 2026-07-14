package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"typex-server/internal/utils"
)

type CreateRoomRequest struct {
	Text string `json:"text"`
}

func (h *Handler) Rooms(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	var req CreateRoomRequest
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	room := h.roomStore.CreateRoom(req.Text)

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"id":         room.ID,
		"expiresAt":  room.ExpiresAt,
		"maxPlayers": room.MaxPlayers,
	})
}

func (h *Handler) RoomByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	roomID := strings.TrimPrefix(r.URL.Path, "/rooms/")
	if roomID == "" {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": "room id is required",
		})
		return
	}

	snapshot, exists := h.roomStore.Snapshot(roomID)
	if !exists {
		utils.WriteJSON(w, http.StatusNotFound, map[string]string{
			"error": "room not found or expired",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, snapshot)
}
