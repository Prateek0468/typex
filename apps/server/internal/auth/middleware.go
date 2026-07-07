package auth

import (
	"context"
	"net/http"
	"typex-server/internal/utils"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			utils.WriteJSON(w, http.StatusUnauthorized, map[string] string {
				"errro": "not logged in",
			})

			return
		}

		claims, err := ValidateToken(cookie.Value)
		if err != nil {
			utils.WriteJSON(w, http.StatusUnauthorized, map[string] string{
				"error": "invalid token",
			})

			return
		}

		ctx := context.WithValue(
			r.Context(),
			"userID",
			claims.UserID,
		)

		next.ServeHTTP(w, r.WithContext(ctx))
	})

}