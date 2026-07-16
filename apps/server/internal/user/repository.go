package user

// contains user db operation queries i.e. just talks to DB
import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// repo struct + constructor
type Repository struct {
	db *pgxpool.Pool // this means a repository is an object that has access to the DB pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db} // constructor which creates a repository instance and attaches the DB pool to it
}


// queries
func (r *Repository) CreateUser(ctx context.Context, name, email, password string) (*User, error) {

	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var user User

	// insert into DB
	err = r.db.QueryRow(ctx, 
	`INSERT INTO users (name, email, password_hash, created_at)
	VALUES ($1, $2, $3, NOW())
	RETURNING id, name, email`, name, email, string(hashedPassword), 
).Scan(&user.ID, &user.Name, &user.Email);


	if err != nil {
		// check if it's a postgresql error
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) { // check if there's a *pgconn.PgError somewhere inside the error
			if pgErr.Code == "23505" { // this is a postgresql error code meaning unique_violation
				return nil, errors.New("email already exists")
			}
		}

		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (User, error) {
	var u User
	err := r.db.QueryRow(ctx, 
		`SELECT id, name, email, password_hash FROM users WHERE email=$1`, email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash)

	return u, err
}

func (r *Repository) GetById(ctx context.Context, id string) (User, error) {
	var u User
	err := r.db.QueryRow(ctx, 
		`SELECT id, name, email, password_hash FROM users WHERE id=$1`, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash)

	return u, err	
}

// get user stats
func (r *Repository) GetUserStats(ctx context.Context, userId string) (*UserStats, error) {
	var stats UserStats

	err := r.db.QueryRow(ctx,
		`SELECT userd_id, avg_wpm, avg_accuracy, best_wpm, total_races FROM user_stats WHERE user_id = $1`, userId,
	).Scan(&stats.UserID, &stats.AverageWPM, &stats.AverageAccuracy, &stats.BestWPM, &stats.TotalRaces)

	if err != nil { 
		return nil, err
	}	

	return &stats, err
}


// update user stats
func (r *Repository) UpdateUserStats(ctx context.Context, userID string, wpm int, accuracy int) error {

	// insert if there is not race data otherwise just update
	result, err := r.db.Exec(ctx, 
		`INSERT INTO user_stats (
			user_id,
			avg_wpm,
			avg_accuracy,
			best_wpm,
			total_races
		)
		VALUES ($1, $2, $3, $2, 1)

		ON CONFLICT (user_id)
		DO UPDATE SET
			avg_wpm = ((user_stats.avg_wpm * user_stats.total_races) + $2) / (user_stats.total_races + 1),
			avg_accuracy = ((user_stats.avg_accuracy * user_stats.total_races) + $3) / (user_stats.total_races + 1),
			best_wpm = GREATEST(user_stats.best_wpm, $2),
			total_races = user_stats.total_races + 1
		`, userID, wpm, accuracy,
	)
	if err != nil {
		return err
	}

	fmt.Println("rows updated:", result.RowsAffected())

	return nil
}


func (r *Repository) GetAllUserStats(ctx context.Context, limit, offset int) ([]UserStats, error) {
	rows, err := r.db.Query(ctx, `
	SELECT user_id, avg_wpm, avg_accuracy, best_wpm, total_races, updated_at
	FROM user_stats ORDER BY best_wpm DESC LIMIT $1 OFFSET $2`, limit, offset)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var users []UserStats
	
	for rows.Next() {
		var user UserStats

		err := rows.Scan(&user.UserID, &user.AverageWPM, &user.AverageAccuracy, &user.BestWPM, &user.TotalRaces, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}

		users = append(users, user);

		if err := rows.Err(); err != nil {
			return nil, err
		}
	}

	return users, nil
}