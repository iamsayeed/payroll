from celery import shared_task
import resend
from decouple import config

resend.api_key = config("RESEND_API_KEY")

@shared_task
def send_resend_email(subject, recipient, html):
    params = {
        "from": config("RESEND_HOST"),
        "to": [recipient],
        "subject": subject,
        "html": html,
    }
    resend.Emails.send(params)
