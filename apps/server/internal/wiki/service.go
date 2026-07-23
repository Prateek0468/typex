package wiki

import (
	"strings"
	"unicode"
)

const (maxTextLength = 1000)

func GetRandomTypingText() (string, error) {
	title, err := GetRandomTitle()
	if err != nil {
		return "", err
	}

	text, err := GetExtract(title)
	if err != nil {
		return "", err
	}

	text = cleanText(text)

	// basic clean
	text = strings.ReplaceAll(text, "\n", " ")
	text = strings.Join(strings.Fields(text), " ")

	// triming if the para is too long

	if len(text) > maxTextLength {
		text = text[:maxTextLength]
	}

	return text, nil
}


// clean the data to only allow english, numbers etc
func cleanText(text string) string {
	var b strings.Builder

	for _, r := range text {
			switch {
			case r >= 'a' && r <= 'z':
					b.WriteRune(r)

			case r >= 'A' && r <= 'Z':
					b.WriteRune(r)

			case unicode.IsDigit(r):
					b.WriteRune(r)

			case unicode.IsSpace(r):
					b.WriteByte(' ')

			case r >= 32 && r <= 126:
					b.WriteRune(r)
			}
	}

	text = strings.Join(strings.Fields(b.String()), " ")

	if len(text) > maxTextLength {
			text = text[:maxTextLength]
			if idx := strings.LastIndex(text, " "); idx > 0 {
					text = text[:idx]
			}
	}

	return text
}