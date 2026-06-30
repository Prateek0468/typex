package wiki

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const baseURL = "https://en.wikipedia.org/w/api.php";

type RandomResp struct {
	Query struct {
		Random []struct {
			ID    int    `json:"id"`
			NS    int    `json:"ns"`
			Title string `json:"title"`
		} `json:"random"`
	} `json:"query"`
}


type ExtractResp struct {
	Query struct {
		Pages map[string] struct {
			Extract string `json:"extract"`
		} `json:"pages"`
	} `json:"query"`
}

// get title -> get page -> get the para from that page

// Get randome article title
func GetRandomTitle() (string, error) {
	// Wikipedia random article API
	u := fmt.Sprintf("%s?action=query&list=random&rnnamespace=0&rnlimit=1&format=json", baseURL)

	// Create request (required for Wikipedia)
	req, err := http.NewRequest("GET", u, nil)
	if err != nil {
		return "", err
	}

	// Wikipedia blocks requests without User-Agent
	req.Header.Set("User-Agent", "TypeX-App/1.0 (learning project)")

	client := &http.Client{}

	// Execute request
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Decode JSON into correct struct
	var data RandomResp
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", err
	}

	// Safety check
	if len(data.Query.Random) == 0 {
		return "", fmt.Errorf("no random page found")
	}

	// Return title
	return data.Query.Random[0].Title, nil
}

// fetch plain text extract
func GetExtract(title string) (string, error) {
	// Step 1: safely encode title for URL usage
	escaped := url.QueryEscape(title)

	// Step 2: build Wikipedia API URL
	u := fmt.Sprintf(
		"%s?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=%s&format=json",
		baseURL,
		escaped,
	)

	// Step 3: create HTTP request (DO NOT use http.Get — Wikipedia requires headers)
	req, err := http.NewRequest("GET", u, nil)
	if err != nil {
		return "", err
	}

	// Step 4: set User-Agent (Wikipedia blocks or downgrades requests without it)
	req.Header.Set("User-Agent", "TypeX-App/1.0 (typing app)")

	// Step 5: execute request using default client
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Step 6: check HTTP status (VERY IMPORTANT for debugging silent failures)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}
	// Step 7: decode JSON safely
	var data ExtractResp
	if err := json.Unmarshal(body, &data); err != nil {
		return "", fmt.Errorf("json error: %w | body: %s", err, string(body))
	}

	// Step 8: Wikipedia returns pages as a map with unknown key
	// so we iterate and return the first available extract
	for _, page := range data.Query.Pages {
		// Step 9: sometimes extract is empty (disambiguation or missing page)
		if page.Extract != "" {
			return page.Extract, nil
		}
	}

	// Step 10: fallback error if no usable extract found
	return "", fmt.Errorf("no valid extract found for title: %s", title)
}

