package handlers

import (
	"net/http"
	
	"typex-server/internal/wiki"
	"typex-server/internal/utils"
)

func(h *Handler) GetRandomText(w http.ResponseWriter, r *http.Request) {
	text, err := wiki.GetRandomTypingText()
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string {
		"text": text,
	})
}