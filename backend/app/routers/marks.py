from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, db
from app.dependencies import get_current_user, require_role
from app.models import UserRole

router = APIRouter()

def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@router.put(
    "/teacher/update-status",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.teacher))]
)
def update_status(
    marks_req: schemas.MarksUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(models.Subject).filter_by(id=marks_req.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if current_user not in subject.assigned_teachers:
        raise HTTPException(status_code=403, detail="You are not assigned to this subject")

    status_record = (
        db.query(models.StudentSubjectStatus)
        .filter_by(student_id=marks_req.student_id, subject_id=marks_req.subject_id)
        .first()
    )
    if not status_record:
        status_record = models.StudentSubjectStatus(
            student_id=marks_req.student_id,
            subject_id=marks_req.subject_id
        )
        db.add(status_record)

    update_data = marks_req.model_dump(exclude_unset=True)

    # Fields corresponding to checkboxes
    boolean_fields = [
        "cie_completed",
        "ha_completed",
        "tw_completed",
        "pbl_completed",
        "sce_presentation_completed",
        "sce_certificate_completed",
        "sce_pbl_completed"
    ]

    for field in boolean_fields:
        if field in update_data:
            setattr(status_record, field, update_data[field])

    db.commit()
    db.refresh(status_record)

    return {"message": "Status updated successfully."}
