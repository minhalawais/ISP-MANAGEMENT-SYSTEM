from flask import render_template
from flask_mail import Message
from app import mail

def send_email(to, subject, template, **kwargs):
    msg = Message(subject, recipients=[to])
    msg.html = render_template(f"emails/{template}.html", **kwargs)
    mail.send(msg)

