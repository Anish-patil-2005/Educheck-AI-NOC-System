# create_admin.py
from app.db import SessionLocal
from app.models import User, UserRole
from app.core.security import get_password_hash

# --- Configuration ---
# Replace with the details for your admin account
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin123"

def create_first_admin():
    print("Connecting to the database...")
    db = SessionLocal()
    
    # Check if the admin user already exists
    existing_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    
    if existing_user:
        print(f"User with email '{ADMIN_EMAIL}' already exists. Aborting.")
        db.close()
        return

    print("Creating new admin user...")
    
    # Hash the password
    hashed_password = get_password_hash(ADMIN_PASSWORD)
    
    # Create the new user instance
    admin_user = User(
        email=ADMIN_EMAIL,
        hashed_password=hashed_password,
        role=UserRole.admin
    )
    
    db.add(admin_user)
    db.commit()
    
    print(f"Admin user '{ADMIN_EMAIL}' created successfully!")
    db.close()

if __name__ == "__main__":
    create_first_admin()