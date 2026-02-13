import os
import uuid
from datetime import datetime
from typing import List, Optional, Literal
import aiofiles
import re
from fastapi import (APIRouter, Depends, HTTPException, UploadFile, File,
                     Query, Security, status, Form, BackgroundTasks ,APIRouter, Depends, HTTPException, UploadFile, File,
                     Query, Security, status, Form, Request)
from pydantic import ValidationError
from sqlalchemy.orm import Session
# In app/routers/assignment.py
from fastapi.responses import FileResponse
from app.email_utils import send_new_assignment_email
from app import models, schemas, db, crud
from app.core.security import  decode_access_token
# Re-adding the utility imports from your old code
from app.utils import bert_utils, tfidf_utils, file_utils
from fastapi.security import OAuth2PasswordBearer
# ===================================================================
# Router and Configuration
# ===================================================================

router = APIRouter(prefix="/assignments", tags=["Assignments & Submissions"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
UPLOAD_DIR = "backend/uploads/assignments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ===================================================================
# Dependencies
# ===================================================================

# In app/routers/assignment.py

# --- Dependencies ---

def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

# CORRECTED: This dependency now uses email for the lookup
async def get_current_user(token: str = Security(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
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

# CORRECTED: These now correctly depend on the updated get_current_user
def get_current_teacher_profile(current_user: models.User = Depends(get_current_user)) -> models.Teacher:
    if current_user.role != models.UserRole.teacher or not current_user.teacher_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a teacher")
    return current_user.teacher_profile

def get_current_student_profile(current_user: models.User = Depends(get_current_user)) -> models.Student:
    if current_user.role != models.UserRole.student or not current_user.student_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a student")
    return current_user.student_profile

async def save_upload_file(upload_file: UploadFile, destination: str):
    async with aiofiles.open(destination, "wb") as out_file:
        while content := await upload_file.read(1024):
            await out_file.write(content)




def sanitize_for_path(name: str) -> str:
    """Removes special characters and replaces spaces with underscores."""
    # Remove characters that are invalid in file/folder names
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    # Replace spaces with a single underscore
    name = re.sub(r'\s+', '_', name)
    return name

# ===================================================================
# Teacher: Assignment Management (CRUD)
# ===================================================================

@router.post(
    "",
    response_model=schemas.AssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Assignment (Metadata)",
)
def create_assignment(
    assignment_data: schemas.AssignmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile),
):
    """
    Creates a new assignment's metadata. Enforces the teacher's authority.
    File uploads should be done via the /assignments/{id}/upload-file endpoint.
    """
    if not crud.verify_teacher_authority(
        db=db, teacher_id=current_teacher.id, subject_id=assignment_data.subject_id,
        division_id=assignment_data.division_id, batch_id=assignment_data.batch_id,
        assignment_type=assignment_data.assignment_type,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the authority or Subject dont has assignment type to create assignment  for this Subject.",
        )
    new_assignment, students_to_notify = crud.create_assignment(
        db=db, assignment_data=assignment_data, teacher_id=current_teacher.id
    )
    if not new_assignment:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assignment . Please try again later"
        )
    # After the assignment is created, trigger the background email task
    #for student in students_to_notify:
        background_tasks.add_task(
            send_new_assignment_email,
            student_name=student.name,
            student_email=student.user.email,
            assignment_id=new_assignment.id,
            assignment_title=new_assignment.title,
            subject_name=new_assignment.subject.name,
            deadline=new_assignment.deadline
        )
        
    return new_assignment

@router.get(
    "/student",
    # UPDATED: Use the new, tailored response schema
    response_model=List[schemas.StudentAssignmentOut],
    summary="Get All Assignments for a Student",
)
def get_student_assignments(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student_profile),
):
    """
    Retrieves all published assignments relevant to the authenticated student's division,
    including their personal submission status for each.
    """
    if not current_student.division_id:
        return []
    
    # UPDATED: Call the new CRUD function, passing the student's ID
    return crud.get_assignments_for_student(db=db, student=current_student)


# In app/routers/assignment.py

@router.post(
    "/{assignment_id}/upload-file",
    response_model=schemas.AssignmentOut,
   
    summary="Upload or Replace an Assignment File"
)
async def upload_assignment_file(
    assignment_id: int,
    file_type: Literal["assignment", "solution"] = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Upload an assignment question paper or a solution file.
    This creates a dynamic directory structure and filename based on the
    assignment's properties.
    """
    # 1. Fetch the assignment with all its related data
    db_assignment = crud.get_assignment_with_details(db, assignment_id)
    if not db_assignment or db_assignment.teacher_id != current_teacher.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found or you are not the owner.")

    # 2. Build the dynamic directory path
    base_dir = "uploads/assignments"
    academic_year = str(db_assignment.division.academic_year)
    department = sanitize_for_path(db_assignment.subject.department.name)
    year = sanitize_for_path(db_assignment.subject.year.value)
    subject = sanitize_for_path(db_assignment.subject.name)
    division = sanitize_for_path(db_assignment.division.name)
    
    # Start with the base path
    target_path = os.path.join(base_dir, academic_year, department, year, subject, division)
    
    # Add a batch sub-folder if it's a lab or tutorial
    if db_assignment.assignment_type in ["Lab Assignment", "Tutorial Assignment"] and db_assignment.batch:
        batch_name = sanitize_for_path(db_assignment.batch.name)
        target_path = os.path.join(target_path, batch_name)

    # 3. Create the directory if it doesn't exist
    os.makedirs(target_path, exist_ok=True)
    
    # 4. Create the dynamic filename
    title = sanitize_for_path(db_assignment.title)
    _, extension = os.path.splitext(file.filename)
    
    if file_type == "assignment":
        new_filename = f"{title}_assignmentFile{extension}"
        # If a file already exists, delete it before saving the new one
        if db_assignment.assignment_file_path and os.path.exists(db_assignment.assignment_file_path):
            os.remove(db_assignment.assignment_file_path)
    else: # 'solution'
        new_filename = f"{title}_solutionFile{extension}"
        if db_assignment.solution_file_path and os.path.exists(db_assignment.solution_file_path):
            os.remove(db_assignment.solution_file_path)

    # 5. Define the full destination path and save the file
    full_file_path = os.path.join(target_path, new_filename)
    await save_upload_file(file, full_file_path)

    # 6. Update the database record with the new path
    if file_type == "assignment":
        db_assignment.assignment_file_path = full_file_path
    else:
        db_assignment.solution_file_path = full_file_path
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


# In app/routers/assignment.py

# It's better to create a new router for submissions for clarity, but for now...
# In app/routers/assignment.py

@router.patch(
    "/submissions/{submission_id}/grade",
    # UPDATED: Use the new, lightweight response model
    response_model=schemas.SubmissionUpdateOut,
    summary="Manually Grade a Student's Submission"
)
def grade_a_submission(
    submission_id: int,
    grade_data: schemas.SubmissionGradeUpdate,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Allows a teacher to set or override the final grade (marks) and provide
    feedback for a student's submission.
    """
    updated_submission = crud.grade_submission(
        db=db, 
        submission_id=submission_id, 
        grade_data=grade_data, 
        teacher_id=current_teacher.id
    )
    if not updated_submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found, you are not authorized to grade it, or the grade is invalid."
        )
    return updated_submission

@router.delete(
    "/{assignment_id}",
    response_model=schemas.MessageResponse,
    summary="Delete an Assignment",
    description="Allows a teacher to delete an assignment they own. This action is irreversible."
)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Deletes a specific assignment after verifying ownership.
    """
    deleted_assignment = crud.delete_assignment(
        db=db, 
        assignment_id=assignment_id, 
        teacher_id=current_teacher.id
    )
    
    if not deleted_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or you do not have permission to delete it."
        )
        
    return {"message": "Assignment deleted successfully"}


@router.get(
    "/teacher",
    response_model=List[schemas.TeacherAssignmentDetail],
    summary="Get All Assignments for a Teacher",
)
def get_teacher_assignments(
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile),
):
    """Retrieves all assignments created by the authenticated teacher with full details."""
    return crud.get_assignments_by_teacher(db=db, teacher_id=current_teacher.id)

@router.get(
    "/{assignment_id}",
    response_model=schemas.TeacherAssignmentDetail,
    summary="Get a Single Assignment by ID",
)
def get_single_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieves one assignment with full details, accessible by its teacher or students in its division."""
    assignment = crud.get_assignment_with_details(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    # Add authorization logic here if needed, e.g., check if user is the teacher or a valid student
    return assignment

# ... Add PATCH and DELETE endpoints for assignments here if needed ...

# Add this endpoint to app/routers/assignment.py

@router.patch(
    "/{assignment_id}/publish",
    response_model=schemas.AssignmentOut,
    summary="Publish a Draft Assignment",
    description="Changes an assignment's status from 'draft' to 'published'."
)
def publish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile)
):
    """
    Publishes a specific assignment after verifying ownership.
    """
    published_assignment = crud.publish_assignment(
        db=db,
        assignment_id=assignment_id,
        teacher_id=current_teacher.id
    )
    
    if not published_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or you do not have permission to publish it."
        )
        
    return published_assignment



# ===================================================================
# Student: Assignment Viewing and Submission
# ===================================================================







# In app/routers/assignment.py

# In app/routers/assignment.py

# Add 'Request' and 'Response' to your fastapi imports
from fastapi import (APIRouter, Depends, HTTPException, UploadFile, File,
                     Query, Security, status, Form, Request, Response)

@router.post(
    "/{assignment_id}/submit",
    response_model=schemas.AssignmentSubmissionOut,
    summary="Submit Work for an Assignment",
    responses={
        404: {"model": schemas.ErrorResponse},
        400: {"model": schemas.BertRejectionResponse, "description": "Submission rejected due to low similarity or plagiarism."}
    }
)
async def create_student_submission(
    assignment_id: int,
    request: Request, 
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student_profile),
):
    """
    Allows a student to submit their work. This endpoint is now fully cancellable
    and will stop processing if the client disconnects.
    """
    # 1. Initial Validation
    assignment = crud.get_assignment_with_details(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # 2. Read file to memory and extract text
    file_content = await file.read()

    # --- CHECK 1: After file read ---
    if await request.is_disconnected():
        print("CLIENT DISCONNECTED after file read. Aborting.")
        return Response(status_code=499, content="Client Closed Request")

    text_for_check = file_utils.extract_text_from_memory(file_content, file.filename)
    if not text_for_check:
        raise HTTPException(status_code=400, detail="Could not extract text from the uploaded file.")

    # 3. Perform BERT score check FIRST
    try:
        bert_score, sample_text = crud.calculate_bert_similarity(assignment, text_for_check)
    except crud.SolutionFileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot process submission: {e}")
    
    # --- CHECK 2: After BERT calculation ---
    if await request.is_disconnected():
        print("CLIENT DISCONNECTED after BERT check. Aborting.")
        return Response(status_code=499, content="Client Closed Request")
    
    if bert_score < 0.70:
        rejection_detail = {
            "detail": f"Submission not accepted. Your work is incorrect or partially correct.\n Your solution having a score of   {int(bert_score*100)}, which is below the required score of 70.",
        }
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=rejection_detail)

    print("bert score: ", {int(bert_score*100)})
    
    # 4. Perform Plagiarism check
    is_plagiarised, fingerprint_json = crud.check_plagiarism(db, assignment_id, text_for_check)

    # --- CHECK 3: After Plagiarism check ---
    if await request.is_disconnected():
        print("CLIENT DISCONNECTED after plagiarism check. Aborting.")
        return Response(status_code=499, content="Client Closed Request")

    if is_plagiarised:
        raise HTTPException(status_code=400, detail="Potential plagiarism detected based on previous submissions. Submission rejected.")

    # 5. All checks passed. Now, save the file to disk.
    teacher_file_dir = os.path.dirname(assignment.assignment_file_path) if assignment.assignment_file_path else os.path.join(UPLOAD_DIR, "unfiled")
    submission_dir = os.path.join(teacher_file_dir, "submissions")
    os.makedirs(submission_dir, exist_ok=True)
    
    filename = f"{current_student.roll_number or current_student.id}_{file.filename}"
    file_path = os.path.join(submission_dir, filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(file_content)

    # 6. Update the database record
    updated_submission = crud.update_student_submission(
        db=db,
        assignment_id=assignment_id,
        content=text_for_check, 
        student=current_student,
        file_path=file_path,
        bert_score=bert_score,
        plagiarism_fingerprint=fingerprint_json
    )

    if not updated_submission:
        raise HTTPException(status_code=404, detail="Could not find a pending submission for you to update.")

    return updated_submission

# ===================================================================
# Teacher: Filtering and Searching Assignments
# ===================================================================

@router.get(
    "/search",
    response_model=List[schemas.TeacherAssignmentDetail],
    summary="Search and Filter Assignments (for Teachers)",
)
def search_assignments( 
    subject_id: Optional[int] = Query(None),
    division_id: Optional[int] = Query(None),
    year: Optional[schemas.YearLevel] = Query(None),
    assignment_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_teacher: models.Teacher = Depends(get_current_teacher_profile),
):
    """Provides advanced filtering for a teacher's assignments."""
    return crud.get_filtered_teacher_assignments(
        db=db, teacher_id=current_teacher.id, subject_id=subject_id,
        division_id=division_id, year=year, assignment_type=assignment_type,
    )



@router.get(
    "/{assignment_id}/download",
    response_class=FileResponse, # Use a special response class for files
    summary="Download an Assignment File",
)
async def download_assignment_file(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Authenticates any user
):
    """
    Securely downloads the main file for a specific assignment.
    This endpoint checks for the file's existence and permissions.
    """
    # 1. Get the assignment from the database
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    # (Optional but recommended) Add authorization logic here. For example:
    # is_teacher = current_user.id == assignment.teacher.user.id
    # is_student_in_division = current_user.student_profile and current_user.student_profile.division_id == assignment.division_id
    # if not (is_teacher or is_student_in_division):
    #     raise HTTPException(status_code=403, detail="Not authorized to download this file")

    # 2. Get the file path from the database record
    file_path = assignment.assignment_file_path
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found for this assignment")

    # 3. Stream the file back to the user
    filename = os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename)