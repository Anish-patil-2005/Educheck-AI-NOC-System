from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
from sqlalchemy.orm import Session

from app import models, schemas, db, crud
# UPDATED: Import the necessary security utilities and models from your new structure
from app.core.security import decode_access_token

router = APIRouter( tags=["Admin"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ===================================================================
# Dependencies
# ===================================================================
def get_db():
    """Dependency to get a new database session for each request."""
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

def get_current_user(
    token: str = Security(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Decodes the JWT token to get the user's email and fetches the
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

# --- Role-Specific Profile Dependencies ---

def get_current_teacher_profile(
    current_user: models.User = Depends(get_current_user)
) -> models.Teacher:
    """
    Dependency that gets the current user and returns their teacher profile.
    """
    if current_user.role != models.UserRole.teacher or not current_user.teacher_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a teacher")
    return current_user.teacher_profile

def get_current_student_profile(
    current_user: models.User = Depends(get_current_user)
) -> models.Student:
    """
    Dependency that gets the current user and returns their student profile.
    """
    if current_user.role != models.UserRole.student or not current_user.student_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a student")
    return current_user.student_profile

def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Dependency that verifies the current user has the 'admin' role.
    """
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have adequate privileges",
        )
    return current_user


# ===================================================================
# Department Management Endpoints
# ===================================================================

@router.post(
    "/departments",
    response_model=schemas.DepartmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Department",
    dependencies=[Depends(get_current_admin_user)],
)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = crud.get_department_by_name(db, name=department.name)
    if db_dept:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    return crud.create_department(db=db, department=department)


@router.get(
    "/departments",
    response_model=List[schemas.DepartmentOut],
    summary="List All Departments",
    dependencies=[Depends(get_current_admin_user)],
)
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()


# ===================================================================
# Division and Batch Management Endpoints
# ===================================================================

@router.post(
    "/divisions",
    response_model=schemas.DivisionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Division and its Batches",
    description="Creates a division and automatically generates its batches (e.g., 'A1', 'A2').",
    dependencies=[Depends(get_current_admin_user)],
)
def create_division_with_batches(division_data: schemas.DivisionCreate, db: Session = Depends(get_db)):
    # The CRUD function should handle the creation of the division and its batches
    return crud.create_division_and_batches(db=db, division_data=division_data)


@router.get(
    "/divisions",
    response_model=List[schemas.DivisionOut],
    summary="List All Divisions",
    dependencies=[Depends(get_current_admin_user)],
)
def list_divisions(db: Session = Depends(get_db)):
    return db.query(models.Division).all()


# ===================================================================
# Subject Management Endpoints
# ===================================================================

@router.post(
    "/subjects",
    response_model=schemas.SubjectOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a New Subject",
    dependencies=[Depends(get_current_admin_user)],
)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    return crud.create_subject(db=db, subject=subject)


@router.get(
    "/subjects",
    response_model=List[schemas.SubjectOut],
    summary="List All Subjects",
    dependencies=[Depends(get_current_admin_user)],
)
def list_subjects(db: Session = Depends(get_db)):
    return db.query(models.Subject).all()


@router.patch(
    "/subjects/{subject_id}",
    response_model=schemas.SubjectOut,
    summary="Update Subject Parameters",
    description="Partially updates a subject's boolean flags or attendance threshold.",
    dependencies=[Depends(get_current_admin_user)],
)
def update_subject_parameters(
    subject_id: int, subject_update: schemas.SubjectParamsUpdate, db: Session = Depends(get_db)
):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    update_data = subject_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)

    db.commit()
    db.refresh(db_subject)
    return db_subject


# ===================================================================
# Teacher Assignment Endpoints
# ===================================================================

# In app/routers/admin.py

@router.post(
    "/teacher-assignments",
    response_model=schemas.TeacherSubjectAssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a Teacher to a Subject/Division/Batch",
)
def assign_teacher_to_subject(
    assignment_data: schemas.TeacherSubjectAssignmentCreate, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user) # Assuming this is the dependency
):
    new_assignment = crud.create_teacher_subject_assignment(db=db, assignment_data=assignment_data)
    
    # If the CRUD function returned None due to a validation failure, raise an error
    if not new_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation failed: The provided Batch ID does not belong to the provided Division ID."
        )
        
    return new_assignment

# In app/routers/admin.py

@router.delete(
    "/teacher-assignments/{assignment_id}",
    response_model=schemas.MessageResponse,
    summary="[Admin] Delete a Teacher-Subject Assignment",
    dependencies=[Depends(get_current_admin_user)],
)
def delete_teacher_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific teacher-subject assignment record from the database.
    Useful for cleaning up incorrect or outdated assignments.
    """
    deleted_assignment = crud.delete_teacher_subject_assignment(db=db, assignment_id=assignment_id)
    
    if not deleted_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher assignment with ID {assignment_id} not found."
        )
        
    return {"message": f"Teacher assignment with ID {assignment_id} deleted successfully."}


@router.get(
    "/teacher-assignments",
    response_model=List[schemas.TeacherSubjectAssignmentOut],
    summary="List All Teacher Assignments",
    dependencies=[Depends(get_current_admin_user)],
)
def list_teacher_assignments(db: Session = Depends(get_db)):
    return db.query(models.TeacherSubjectAssignment).all()


# ===================================================================
# User Listing Endpoints
# ===================================================================

@router.get(
    "/students",
    response_model=List[schemas.StudentOut],
    summary="List All Students",
    dependencies=[Depends(get_current_admin_user)],
)
def list_students(db: Session = Depends(get_db)):
    # Query the new Student profile table
    return db.query(models.Student).all()


@router.get(
    "/teachers",
    response_model=List[schemas.TeacherOut],
    summary="List All Teachers",
    dependencies=[Depends(get_current_admin_user)],
)
def list_teachers(db: Session = Depends(get_db)):
    # Query the new Teacher profile table
    return db.query(models.Teacher).all()


@router.get(
    "/users",
    response_model=List[schemas.UserOut],
    summary="List All User Accounts",
    description="Lists all core user accounts (email, role, ID) without profile details.",
    dependencies=[Depends(get_current_admin_user)],
)
def list_users(db: Session = Depends(get_db)):
    # Query the central User account table
    return db.query(models.User).all()



@router.post(
    "/students/batch",
    response_model=schemas.BatchSignupResponse,
    summary="Batch Create Students",
    description="Create multiple student accounts and profiles in a single request. Skips existing emails.",
    dependencies=[Depends(get_current_admin_user)],
)
def batch_create_students(signup_data: schemas.StudentBatchSignup, db: Session = Depends(get_db)):
    """
    Handles the API request for batch-creating students.
    """
    return crud.batch_create_student_users(db=db, signup_data=signup_data)



# In app/routers/admin.py
import os # Add this import if it's not already there

@router.delete(
    "/submissions/{submission_id}",
    response_model=schemas.MessageResponse,
    summary="[Dev Tool] Delete a Single Assignment Submission",
    description="Deletes a specific submission record and its associated file from the disk. Requires admin privileges.",
    dependencies=[Depends(get_current_admin_user)],
)
def delete_single_submission(submission_id: int, db: Session = Depends(get_db)):
    """
    A simple endpoint for developers to clean up specific submission records
    and their corresponding uploaded files.
    """
    # 1. Find the submission record in the database
    db_submission = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.id == submission_id
    ).first()

    # 2. If it doesn't exist, return a 404 error
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission record not found")
    
    # 3. Get the file path from the record
    file_path = db_submission.file_path
    
    # 4. If a file path exists and the file is on disk, delete the file
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError as e:
            # If file deletion fails, raise an error to prevent deleting the DB record
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete the associated file: {e}"
            )
            
    # 5. Delete the database record
    db.delete(db_submission)
    db.commit()
    
    return {"message": f"Submission {submission_id} and associated file deleted successfully."}




# In app/routers/admin.py

@router.post(
    "/students/backfill-sce-records",
    response_model=schemas.BackfillResponse,
    summary="[Dev Tool] Backfill SCE Records",
    description="Creates missing StudentSubjectStatus records for a batch of students. Does not create duplicates.",
    dependencies=[Depends(get_current_admin_user)],
)
def backfill_sce_records(data: schemas.StudentIDList, db: Session = Depends(get_db)):
    """
    A temporary endpoint to fix existing students who are missing their
    auto-generated SCE/subject status records.
    """
    result = crud.backfill_student_sce_records(db=db, student_ids=data.student_ids)
    return result


# In app/routers/admin.py

@router.patch(
    "/students/{student_id}/attendance",
    response_model=schemas.StudentSubjectStatusOut,
    summary="Update a Single Student's Attendance"
)
def update_single_student_attendance(
    student_id: int,
    update_data: schemas.StudentAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Updates the attendance percentage for a single student in a given subject."""
    updated_record = crud.update_student_attendance(
        db, 
        student_id=student_id, 
        subject_id=update_data.subject_id, 
        percentage=update_data.attendance_percentage
    )
    if not updated_record:
        raise HTTPException(status_code=404, detail="Student-subject status record not found.")
    return updated_record


@router.patch(
    "/divisions/{division_id}/attendance",
    response_model=schemas.BatchUpdateResponse,
    summary="Update Attendance for an Entire Division"
)
def update_division_attendance(
    division_id: int,
    update_data: schemas.DivisionAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Performs a bulk update of attendance for all students in a division for a subject."""
    updated_count = crud.batch_update_attendance_for_division(
        db,
        division_id=division_id,
        subject_id=update_data.subject_id,
        percentage=update_data.attendance_percentage
    )
    return {
        "message": f"Successfully updated attendance for students in division {division_id}.",
        "records_updated": updated_count
    }



# In app/routers/admin.py

@router.patch(
    "/students/{student_id}/cie",
    response_model=schemas.StudentSubjectStatusOut,
    summary="Update a Single Student's CIE Marks"
)
def update_single_student_cie(
    student_id: int,
    update_data: schemas.StudentCieUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Updates the CIE marks for a single student in a given subject."""
    updated_record = crud.update_student_cie(
        db, 
        student_id=student_id, 
        subject_id=update_data.subject_id, 
        marks=update_data.marks_cie
    )
    if not updated_record:
        raise HTTPException(status_code=404, detail="Student-subject status record not found.")
    return updated_record


@router.patch(
    "/divisions/{division_id}/cie",
    response_model=schemas.BatchUpdateResponse,
    summary="Update CIE Marks for an Entire Division"
)
def update_division_cie(
    division_id: int,
    update_data: schemas.DivisionCieUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Performs a bulk update of CIE marks for all students in a division for a subject."""
    updated_count = crud.batch_update_cie_for_division(
        db,
        division_id=division_id,
        subject_id=update_data.subject_id,
        marks=update_data.marks_cie
    )
    return {
        "message": f"Successfully updated CIE marks for students in division {division_id}.",
        "records_updated": updated_count
    }



# In app/routers/admin.py

@router.get(
    "/teacher-assignments/details",
    response_model=List[schemas.DetailedTeacherAssignmentOut],
    summary="[Admin] Get Detailed Teacher Assignments with Student Rosters",
    dependencies=[Depends(get_current_admin_user)],
)
def get_detailed_assignments(db: Session = Depends(get_db)):
    """
    Provides a comprehensive list of all teacher assignments, including a
    roster of the specific students belonging to each authority group.
    """
    return crud.get_detailed_teacher_assignments(db=db)


# In app/routers/admin.py

@router.patch(
    "/divisions/{division_id}/lab-attendance",
    response_model=schemas.BatchUpdateResponse,
    summary="[Admin] Update Lab Attendance for an Entire Division"
)
def update_division_lab_attendance(
    division_id: int,
    update_data: schemas.DivisionLabAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Performs a bulk update of lab attendance for all students in a division for a subject."""
    updated_count = crud.batch_update_lab_attendance_for_division(
        db,
        division_id=division_id,
        subject_id=update_data.subject_id,
        percentage=update_data.lab_attendance_percentage
    )
    return {"message": "Lab attendance updated.", "records_updated": updated_count}


@router.patch(
    "/divisions/{division_id}/tutorial-attendance",
    response_model=schemas.BatchUpdateResponse,
    summary="[Admin] Update Tutorial Attendance for an Entire Division"
)
def update_division_tutorial_attendance(
    division_id: int,
    update_data: schemas.DivisionTutorialAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Performs a bulk update of tutorial attendance for all students in a division for a subject."""
    updated_count = crud.batch_update_tutorial_attendance_for_division(
        db,
        division_id=division_id,
        subject_id=update_data.subject_id,
        percentage=update_data.tutorial_attendance_percentage
    )
    return {"message": "Tutorial attendance updated.", "records_updated": updated_count}









# In app/routers/admin.py

@router.patch(
    "/students/{student_id}/lab-attendance",
    response_model=schemas.StudentSubjectStatusOut,
    summary="[Admin] Update a Single Student's Lab Attendance"
)
def update_single_student_lab_attendance(
    student_id: int,
    update_data: schemas.StudentLabAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Updates the lab attendance percentage for a single student in a given subject."""
    updated_record = crud.update_student_lab_attendance(
        db, 
        student_id=student_id, 
        subject_id=update_data.subject_id, 
        percentage=update_data.lab_attendance_percentage
    )
    if not updated_record:
        raise HTTPException(status_code=404, detail="Student-subject status record not found.")
    return updated_record


@router.patch(
    "/batches/{batch_id}/lab-attendance",
    response_model=schemas.BatchUpdateResponse,
    summary="[Admin] Update Lab Attendance for an Entire Batch"
)
def update_batch_lab_attendance(
    batch_id: int,
    update_data: schemas.BatchLabAttendanceUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """Performs a bulk update of lab attendance for all students in a batch for a subject."""
    updated_count = crud.batch_update_lab_attendance_for_batch(
        db,
        batch_id=batch_id,
        subject_id=update_data.subject_id,
        percentage=update_data.lab_attendance_percentage
    )
    return {
        "message": f"Successfully updated lab attendance for students in batch {batch_id}.",
        "records_updated": updated_count
    }



# In app/routers/admin.py

@router.delete(
    "/students/{student_id}",
    # Ensure you have a generic MessageResponse schema or use dict
    summary="[Admin] Delete Student Account",
    description="Permanently deletes a student, their user account, all submissions (including files), and academic records.",
    dependencies=[Depends(get_current_admin_user)],
)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific student by ID.
    """
    result = crud.delete_student_account(db=db, student_id=student_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )
        
    return result










# demopassword123
# teacher@123


