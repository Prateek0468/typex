package wiki

import (
	"strings"
)

func GetRandomTypingText() (string, error) {
	title, err := GetRandomTitle()
	if err != nil {
		return "", err
	}

	text, err := GetExtract(title)
	if err != nil {
		return "", err
	}

	// basic clean
	text = strings.ReplaceAll(text, "\n", " ")
	text = strings.Join(strings.Fields(text), " ")

	// triming if the para is too long

	if len(text) > 1200 {
		text = text[:1200]
	}

	return text, nil
}