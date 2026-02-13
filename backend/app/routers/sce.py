from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime

from app import models, schemas, db, crud
from app.dependencies import get_current_teacher_profile, get_db

router = APIRouter(
    prefix="/sce-details",
    tags=["Marks & SCE Management"]
)

# In app/routers/marks_sce.py

@router.get(
    "",
    response_model=schemas.SceDetailsResponse,
    summary="Get SCE Details for a Subject/Division"
)
def get_all_sce_details(
    subject_id: int,
    division_id: int,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Fetches and categorizes SCE records based on the teacher's specific
    view and update permissions for the requested division.
    """
    # --- NEW: Authorization Check ---
    # Verify that the current teacher has ANY authority for the requested group.
    # This grants them read access.
    has_authority = crud.has_any_division_authority(
        db=db, 
        teacher_id=current_teacher.id, 
        subject_id=subject_id, 
        division_id=division_id
    )
    if not has_authority:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view SCE details for this division."
        )
    # --------------------------------

    # If the check passes, proceed with fetching the data.
    return crud.get_sce_details_for_teacher(
        db=db, 
        teacher_id=current_teacher.id, 
        subject_id=subject_id, 
        division_id=division_id
    )


@router.patch(
    "",
    response_model=schemas.SCEDetailOut,
    summary="Update a Student's SCE Status (Update Access)"
)
def update_student_sce_details(
    update_data: schemas.MarksUpdateRequest,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Updates a single student's SCE status. Restricted to the Lab or Tutorial
    teacher assigned to the student's specific batch.
    """
    # UPDATED: Stricter check for batch-level update authority
    if not crud.verify_batch_level_sce_authority(
        db=db, teacher_id=current_teacher.id, 
        subject_id=update_data.subject_id, student_id=update_data.student_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update SCE details for this student's batch."
        )

    updated_record = crud.update_sce_details(db=db, update_data=update_data)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Student status record not found.")

    return updated_record