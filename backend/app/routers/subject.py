

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app import models, schemas, db

# --- Router Setup ---
# 1. Create the router instance
router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"]
)

# --- Dependency ---
def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

# --- Endpoints ---
# 2. Use '@router' to define your endpoints
@router.get("", response_model=List[schemas.SubjectOut], summary="List all available subjects")
def list_all_subjects(db: Session = Depends(get_db)):
    """
    Retrieve a list of all subjects available in the system.
    This is a public endpoint accessible to any authenticated user.
    """
    subjects = db.query(models.Subject).all()
    return subjects

@router.get("/{subject_id}", response_model=schemas.SubjectOut, summary="Get a single subject by ID")
def get_subject_by_id(subject_id: int, db: Session = Depends(get_db)):
    """
    Retrieve detailed information for a single subject by its ID.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject