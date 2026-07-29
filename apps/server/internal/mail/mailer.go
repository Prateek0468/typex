package mail

import (
	"fmt"

	"github.com/resend/resend-go/v3"
)

type Mailer struct {
	client *resend.Client
	from   string
}

func NewMailer(apiKey string, from string) *Mailer {
	return &Mailer{
		client: resend.NewClient(apiKey),
		from:   from,
	}
}


func (m *Mailer) SendVerificationEmail(
	to string,
	token string,
) error {

	link := fmt.Sprintf(
		"http://localhost:8080/verify-email?token=%s",
		token,
	)

	params := &resend.SendEmailRequest{
		From: m.from,
		To: []string{
			to,
		},
		Subject: "Verify your TypeX account",
		Html: fmt.Sprintf(
			`
			<h2>Welcome to TypeX</h2>
			<p>Click below to verify your email:</p>
			<a href="%s">
				Verify Email
			</a>
			`,
			link,
		),
	}

	_, err := m.client.Emails.Send(params)

	return err
}