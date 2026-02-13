# In app/routers/teacher.py

from fastapi import APIRouter, Depends
# In app/routers/teacher.py

from sqlalchemy.orm import Session, selectinload, joinedload # <-- UPDATE THIS LINE
# ... other imports

from app import models, schemas, db
from app.dependencies import get_current_teacher_profile # Use the central dependency

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher Dashboard"]
)

# --- Dependency ---
def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


@router.get(
    "/filter-options",
    response_model=schemas.FilterOptionsOut,
    summary="Get Filter Options for a Teacher's Dashboard"
)
def get_teacher_filter_options(
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Retrieves the unique subjects, classes, divisions, and dynamically determined
    assignment types and years associated with the authenticated teacher to populate UI filters.
    """
    teacher_assignments = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == current_teacher.id
    ).options(
        joinedload(models.TeacherSubjectAssignment.subject),
        joinedload(models.TeacherSubjectAssignment.division),
        joinedload(models.TeacherSubjectAssignment.batch)
    ).all()

    subjects_map = {}
    divisions_map = {}
    batches_map = {}
    assignment_types_set = set()
    years_set = set()  # <-- ADD: Initialize a set for years
    authorities = []

    for assign in teacher_assignments:
        authorities.append({
            "subject_id": assign.subject_id,
            "division_id": assign.division_id,
            "authority_type": assign.authority_type.value
        })
        if assign.subject and assign.subject.id not in subjects_map:
            # CHANGED: Now storing the year along with id and name
            subjects_map[assign.subject.id] = {
                "id": assign.subject.id,
                "name": assign.subject.name,
                "year": assign.subject.year.value 
            }

        if assign.division and assign.division.id not in divisions_map:
            divisions_map[assign.division.id] = {"id": assign.division.id, "name": assign.division.name}
            years_set.add(assign.division.year.value) # <-- ADD: Collect the year's string value

        if assign.batch and assign.batch.id not in batches_map:
            batches_map[assign.batch.id] = {"id": assign.batch.id, "name": assign.batch.name, "division_id": assign.division.id}

        # (Existing logic for assignment_types_set)
        if assign.authority_type == models.AssignmentAuthorityType.THEORY:
            assignment_types_set.add("Theory Assignment")
            assignment_types_set.add("Defaulter Assignment")
            if assign.subject.has_ha:
                assignment_types_set.add("Home Assignment")
        elif assign.authority_type == models.AssignmentAuthorityType.LAB:
            assignment_types_set.add("Lab Assignment")
        elif assign.authority_type == models.AssignmentAuthorityType.TUTORIAL:
            assignment_types_set.add("Tutorial Assignment")
            
    return schemas.FilterOptionsOut(
        subjects=list(subjects_map.values()),
        # 'classes' seems redundant if you have divisions and years, but keeping if needed
        classes=[], 
        divisions=list(divisions_map.values()),
        batches=list(batches_map.values()),
        assignmentTypes=sorted(list(assignment_types_set)),
        years=sorted(list(years_set)), # <-- ADD: Return the sorted list of years
        authorities=authorities
    )   