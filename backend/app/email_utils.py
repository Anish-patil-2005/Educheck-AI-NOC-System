from datetime import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app import models

# IMPORTANT: Define the base URL of your frontend application
FRONTEND_URL = "https://educheck-ai-assignment-noc-system-8r7pgobrx.vercel.app/" 

# Use environment variables for security in a real app
conf = ConnectionConfig(
    MAIL_USERNAME = "your_email@gmail.com",
    MAIL_PASSWORD = "your_gmail_app_password",
    MAIL_FROM = "your_email@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
)

async def send_new_assignment_email(
    student_name: str, 
    student_email: str, 
    assignment_id: int,
    assignment_title: str,
    subject_name: str,
    deadline: datetime
):
    """
    Sends a formatted HTML email using plain data, not SQLAlchemy objects.
    """
    return

    assignment_url = f"{FRONTEND_URL}/assignments/{assignment_id}"


    
    html_body = f"""
    <html>
        <body>
            <h3>Hi {student_name},</h3>
            <p>A new assignment has been posted for your subject: <strong>{subject_name}</strong>.</p>
            <h4>{assignment_title}</h4>
            <p><strong>Due Date:</strong> {deadline.strftime('%d %b %Y, %I:%M %p')}</p>
            <a href="{assignment_url}" ...>View Assignment Details</a>
            ...
        </body>
    </html>
    """
    
    message = MessageSchema(
        subject=f"New Assignment Posted: {assignment_title}",
        recipients=[student_email],
        body=html_body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)