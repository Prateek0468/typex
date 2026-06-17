package user

// contains user db operation queries i.e. just talks to DB
import (
	"context"
	"errors"

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
func (r *Repository) CreateUser(ctx context.Context, name, email, password string) error {

	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}


	// insert into DB
	_, err = r.db.Exec(ctx,
		`INSERT INTO users (name, email, password_hash, created_at)
		 VALUES ($1, $2, $3, NOW())`,
		name, email, string(hashedPassword),
	)
	if err != nil {
		// check if it's a postgresql error
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) { // check if there's a *pgconn.PgError somewhere inside the error
			if pgErr.Code == "23505" { // this is a postgresql error code meaning unique_violation
				return errors.New("email already exists")
			}
		}

		return err
	}

	return nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (User, error) {
	var u User
	err := r.db.QueryRow(ctx, 
		`SELECT id, name, email, password_hash FROM users WHERE email=$1`, email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash)

	return u, err
}