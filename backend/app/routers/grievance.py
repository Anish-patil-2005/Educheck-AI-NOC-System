from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, db
from app.dependencies import get_current_user, require_role
from app.models import UserRole
from enum import Enum
from typing import List, Optional

router = APIRouter()

def get_db():
    db = db.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GrievanceStatus(str, Enum):
    pending = "Pending"
    resolved = "Resolved"
    rejected = "Rejected"

@router.post("/grievance", response_model=schemas.GrievanceOut, dependencies=[Depends(require_role(UserRole.student))])
def submit_grievance(grievance: schemas.GrievanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Associate grievance to current user
    db_grievance = models.Grievance(**grievance.model_dump(), student_id=current_user.id)
    db.add(db_grievance)
    db.commit()
    db.refresh(db_grievance)
    return db_grievance

@router.get("/grievance", response_model=List[schemas.GrievanceOut], dependencies=[Depends(require_role(UserRole.student))])
def get_student_grievances(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    grievances = db.query(models.Grievance).filter(models.Grievance.student_id == current_user.id).all()
    return grievances

@router.put("/grievance/{grievance_id}/status", dependencies=[Depends(require_role(UserRole.admin))])
def update_grievance_status(grievance_id: int, status: GrievanceStatus, response: Optional[str] = None, db: Session = Depends(get_db)):
    grievance = db.query(models.Grievance).get(grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    grievance.status = status.value
    grievance.response = response
    db.commit()
    return {"message": "Grievance status updated successfully."}
