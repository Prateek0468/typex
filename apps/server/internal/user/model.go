package user

type User struct {
	ID        string
	Name      string
	Email     string
	PasswordHash  string
}

type UserStats struct {
	UserID string
	TotalRaces int
	AverageWPM int
	AverageAccuracy int
	BestWPM int
}