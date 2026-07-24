package auth

import (
	"crypto/rand"
	"encoding/hex"
)


// just generates a random token we can use for verification of user email
func GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}