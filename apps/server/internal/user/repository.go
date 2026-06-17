package user

// contains user db operation queries i.e. just talks to DB
import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// repo struct + constructor 
type Repository struct {
	db *pgxpool.Pool // this means a repository is an object that has access to the DB pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db} // constructor which creates a repository instance and attaches the DB pool to it
}


// queries
func (r *Repository) CreateUser(ctx context.Context, name, email, passwordHash string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW())`, name, email, passwordHash,
	)

	return err
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (User, error) {
	var u User
	err := r.db.QueryRow(ctx, 
		`SELECT id, name, email, password_hash FROM users WHERE email=$1`, email,
	).Scan(&u.ID, &u.Name, &u.PasswordHash)

	return u, err
}