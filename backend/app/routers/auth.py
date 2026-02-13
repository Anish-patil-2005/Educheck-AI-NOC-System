from fastapi import APIRouter, Depends, HTTPException, status, Security
from typing import Union
from sqlalchemy.orm import Session
from app import schemas, crud, db, models

# UPDATED: Import the necessary security utilities and the new dependencies
from app.core.security import create_access_token
from app.dependencies import get_db, get_current_user

router = APIRouter(tags=["Authentication"])

@router.post(
    "/signup/student",
    response_model=schemas.StudentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student"
)
def signup_student(student_data: schemas.StudentSignup, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=student_data.user.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    return crud.create_student_user(db=db, student_data=student_data)

@router.post(
    "/signup/teacher",
    response_model=schemas.TeacherOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new teacher"
)
def signup_teacher(teacher_data: schemas.TeacherSignup, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=teacher_data.user.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    return crud.create_teacher_user(db=db, teacher_data=teacher_data)

@router.post(
    "/token",
    response_model=schemas.Token,
    summary="User Login for Access Token"
)
def login(
    user_credentials: schemas.LoginRequest, db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, email=user_credentials.email, password=user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # UPDATED: Create token with user's email as the subject
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get(
    "/me",
    response_model=Union[schemas.StudentOut, schemas.TeacherOut, schemas.UserOut],
    summary="Get current user's full profile"
)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns the detailed profile (Student or Teacher) of the currently
    authenticated user. Returns basic user info for admins.
    """
    if current_user.role == models.UserRole.student:
        return current_user.student_profile
    if current_user.role == models.UserRole.teacher:
        return current_user.teacher_profile
    return current_user