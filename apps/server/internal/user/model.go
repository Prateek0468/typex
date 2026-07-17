package user

import "time"

type User struct {
	ID        string
	Name      string
	Email     string
	PasswordHash  string
}

type UserStats struct {
	UserID          string  `json:"userId"`
	Name            string   `json:"name"`
	AverageWPM      int     `json:"averageWPM"`
	AverageAccuracy int     `json:"averageAccuracy"`
	BestWPM         int     `json:"bestWPM"`
	TotalRaces      int     `json:"totalRaces"`
	UpdatedAt       time.Time `json:"updatedAt"`
}