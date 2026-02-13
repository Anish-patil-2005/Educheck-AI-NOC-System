# In app/dependencies.py

from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Callable

from app import models, db, crud
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Core Dependencies ---

def get_db():
    """Dependency to get a new database session for each request."""
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

# UPDATED: This dependency now uses email for the lookup
def get_current_user(
    token: str = Security(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Decodes the JWT token to get the email and fetches the
    user account from the database.
    """
    
    email = decode_access_token(token)
    

    if not email:
       
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = crud.get_user_by_email(db, email=email)
    
    
    if not user:
     
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
  
    return user


# --- Role-Specific Profile Dependencies (No changes needed) ---

def get_current_teacher_profile(
    current_user: models.User = Depends(get_current_user)
) -> models.Teacher:
    if current_user.role != models.UserRole.teacher or not current_user.teacher_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a teacher")
    return current_user.teacher_profile

def get_current_student_profile(
    current_user: models.User = Depends(get_current_user)
) -> models.Student:
    """
    Dependency that gets the current user and returns their student profile.
    """
  
    
    is_student_role = current_user.role == models.UserRole.student
    has_profile = current_user.student_profile is not None
    
   
    
    if not is_student_role or not has_profile:
      
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a student")
        
    
    return current_user.student_profile

def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have adequate privileges",
        )
    return current_user



# Add these imports to the top of dependencies.py if they are not there
from typing import Callable
from app import models

# Add this entire function to the end of dependencies.py
def require_role(required_role: models.UserRole) -> Callable:
    """
    A dependency factory that returns a dependency function to check for a specific role.
    Example Usage: dependencies=[Depends(require_role(models.UserRole.admin))]
    """
    def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role.value} role",
            )
        return current_user
    return role_checker