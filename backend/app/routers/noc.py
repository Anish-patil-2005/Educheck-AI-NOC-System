from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app import models, schemas, db, crud
from app.dependencies import get_db, get_current_teacher_profile

router = APIRouter(prefix="/noc", tags=["NOC Management"])

# @router.get(
#     "/details",
#     response_model=List[schemas.NocDetailRow],
#     summary="Get Detailed NOC Data for a Class"
# )
# def get_noc_details(
#     subject_id: int,
#     division_id: int,
#     db: Session = Depends(get_db),
#     current_teacher: models.Teacher = Depends(get_current_teacher_profile)
# ):
#     """
#     Constructs and returns the detailed, two-row-per-student NOC status view
#     for a teacher's authorized subject and division.
#     """
#     return crud.get_noc_details_for_teacher(
#         db, teacher_id=current_teacher.id, subject_id=subject_id, division_id=division_id
#     )

# In app/routers/noc.py
from fastapi import Query # Add Query to your imports

# In app/routers/noc.py
from fastapi import Query



@router.get(
    "/details",
    response_model=List[schemas.NocDetailRow],
    summary="Get Detailed NOC Data for a Class",
    responses={
        403: {"model": schemas.ErrorResponse, "description": "Permission denied for this group."}
    }
)
def get_noc_details(
    subject_id: int,
    division_id: int,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Constructs and returns the detailed, multi-row NOC status view
    for a teacher's authorized subject and division.
    """
    # 1. Authorize: Check if the teacher has ANY role for this subject/division
    has_authority = crud.has_any_division_authority(
        db=db,
        teacher_id=current_teacher.id,
        subject_id=subject_id,
        division_id=division_id
    )

    if not has_authority:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view NOC details for this group."
        )

    # 2. If authorized, fetch and return the formatted data
    return crud.get_noc_details_for_teacher(
        db, 
        teacher_id=current_teacher.id, 
        subject_id=subject_id, 
        division_id=division_id
    )

@router.post(
    "/recalculate",
    response_model=schemas.MessageResponse,
    summary="Recalculate NOC Statuses for a Division"
)
def recalculate_noc(
    subject_id: int,
    division_id: int,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Triggers a full recalculation of the 'Pending'/'Completed' status for all
    students in a selected subject and division. This is a write operation.
    """
    # --- Corrected Authorization Logic ---
    # Check if the teacher has ANY role for this subject/division to grant permission.
    has_authority = crud.has_any_division_authority(
        db=db,
        teacher_id=current_teacher.id,
        subject_id=subject_id,
        division_id=division_id
    )

    if not has_authority:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view the noc of this div."
        )
    # --- End Authorization Logic ---

    # If authorized, proceed with the recalculation.
    count = crud.recalculate_noc_statuses(db, subject_id, division_id)
    
    return {"message": f"Successfully recalculated statuses. {count} records were updated."}

@router.patch(
    "/status/{status_record_id}",
    response_model=schemas.StudentSubjectStatusOut,
    summary="Update a Student's Final NOC Status"
)
def update_noc_status(
   status_record_id: int,
    update_data: schemas.NocStatusUpdate,
    noc_type: str = Query(..., enum=["Theory", "Lab", "Tutorial"]),
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    record = db.query(models.StudentSubjectStatus).get(status_record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Status record not found.")
    
   
     # --- Authorization Logic ---
    has_authority = False
    if noc_type == "Theory":
        has_authority = crud.verify_teacher_authority(
            db, teacher_id=current_teacher.id, subject_id=record.subject_id,
            division_id=record.student.division_id, batch_id=None,
            assignment_type="Theory Assignment"
        )
    elif noc_type in ["Lab", "Tutorial"]:
        has_authority = crud.verify_batch_level_sce_authority(
            db, teacher_id=current_teacher.id, subject_id=record.subject_id,
            student_id=record.student_id
        )
    
    if not has_authority:
        raise HTTPException(status_code=403, detail=f"You do not have authority...")
        
    # --- CORRECTED UPDATE LOGIC ---
    # Update the object's attributes
   # UPDATED: Update the correct column based on noc_type
    if noc_type == "Theory":
        record.theory_noc_status = update_data.noc_status
    else: # This covers both "Lab" and "Tutorial" types
        record.lab_tut_noc_status = update_data.noc_status
        
    record.noc_reason = update_data.reason or ""
    db.commit()
    db.refresh(record)
    return record


# In app/routers/noc.py
from sqlalchemy.orm import joinedload
from app.dependencies import get_current_teacher_profile # Ensure this is your central dependency

@router.get(
    "/filter-options",
    response_model=schemas.NocFilterOptionsOut,
    summary="Get Filter Options for NOC Management"
)
def get_noc_filter_options(
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Retrieves the unique subjects (with their component flags) and divisions
    associated with the authenticated teacher to populate the NOC filter dropdowns.
    """
    # 1. Fetch all of the teacher's specific assignments to subjects/divisions
    teacher_assignments = (
        db.query(models.TeacherSubjectAssignment)
        .filter(models.TeacherSubjectAssignment.teacher_id == current_teacher.id)
        .options(
            # Eagerly load the related Subject and Division data
            joinedload(models.TeacherSubjectAssignment.subject),
            joinedload(models.TeacherSubjectAssignment.division)
        )
        .all()
    )

    # 2. Use dictionaries to collect unique subjects and divisions
    subjects_map = {}
    divisions_map = {}

    for assign in teacher_assignments:
        if assign.subject and assign.subject.id not in subjects_map:
            subjects_map[assign.subject.id] = assign.subject
        if assign.division and assign.division.id not in divisions_map:
            divisions_map[assign.division.id] = assign.division
            
    # 3. Return the final, structured response
    return {
        "subjects": list(subjects_map.values()),
        "divisions": list(divisions_map.values())
    }


# In app/routers/noc.py
from app.dependencies import get_current_student_profile # Use the student dependency

@router.get(
    "/student/me",
    response_model=List[schemas.StudentNocDetailRow],
    summary="Get Detailed NOC Data for the Logged-in Student"
)
def get_my_noc_details(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student_profile)
):
    """
    Constructs and returns the detailed, multi-row-per-subject NOC status view
    for the currently authenticated student.
    """
    return crud.get_noc_details_for_student(db=db, student=current_student)