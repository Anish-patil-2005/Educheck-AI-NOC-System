from datetime import datetime
from logging import Manager
from sqlalchemy import and_
from sqlalchemy.orm import Session
from app import models, schemas
from app.core.security import get_password_hash, verify_password

# --- User, Student, Teacher CRUD ---

def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    """
    Authenticates a user by checking their email and password.
    Returns the user object on success, None on failure.
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_user_by_email(db: Session, email: str) -> models.User | None:
    """Fetches a user account by email from the central User table."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_student_user(db: Session, student_data: schemas.StudentSignup) -> models.Student:
    """
    Creates a new User account and its associated Student profile in a single transaction.
    """
    # Hash the password from the user data
    hashed_password = get_password_hash(student_data.user.password)
    
    # Create the central User account
    db_user = models.User(
        email=student_data.user.email,
        hashed_password=hashed_password,
        role=models.UserRole.student  # Force role to student
    )

    # Create the Student profile with its specific details
    db_student_profile = models.Student(
        name=student_data.name,
        roll_number=student_data.roll_number,
        year=student_data.year,
        division_id=student_data.division_id,
        user=db_user  # Link the profile to the user account
    )

    db.add(db_student_profile)
    db.commit()
    db.refresh(db_student_profile)
    return db_student_profile

def create_teacher_user(db: Session, teacher_data: schemas.TeacherSignup) -> models.Teacher:
    """
    Creates a new User account and its associated Teacher profile in a single transaction.
    """
    hashed_password = get_password_hash(teacher_data.user.password)
    
    db_user = models.User(
        email=teacher_data.user.email,
        hashed_password=hashed_password,
        role=models.UserRole.teacher # Force role to teacher
    )

    db_teacher_profile = models.Teacher(
        name=teacher_data.name,
        user=db_user
    )

    db.add(db_teacher_profile)
    db.commit()
    db.refresh(db_teacher_profile)
    return db_teacher_profile

# --- Department CRUD ---

def get_department_by_name(db: Session, name: str) -> models.Department | None:
    return db.query(models.Department).filter(models.Department.name == name).first()

def create_department(db: Session, department: schemas.DepartmentCreate) -> models.Department:
    db_department = models.Department(name=department.name)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

# --- Division and Batch CRUD ---

def create_division_and_batches(db: Session, division_data: schemas.DivisionCreate) -> models.Division:
    """
    Creates a Division and then programmatically creates the specified number of Batches for it.
    """
    # Create the Division object
    db_division = models.Division(
        name=division_data.name,
        department_id=division_data.department_id,
        year=division_data.year,
        academic_year=division_data.academic_year
    )
    db.add(db_division)
    db.flush() # Use flush to get the db_division.id before the final commit

    # Create the Batch objects based on the count
    for i in range(1, division_data.num_batches + 1):
        batch_name = f"{division_data.name}{i}"
        db_batch = models.Batch(name=batch_name, division_id=db_division.id)
        db.add(db_batch)

    db.commit()
    db.refresh(db_division)
    return db_division

# --- Subject CRUD ---

def create_subject(db: Session, subject: schemas.SubjectCreate) -> models.Subject:
    # Check if subject with same name, department, and year already exists
    existing_subject = db.query(models.Subject).filter(
        models.Subject.name == subject.name,
        models.Subject.department_id == subject.department_id,
        models.Subject.year == subject.year
    ).first()
    if existing_subject:
        # In a real app, you would raise an HTTPException here from the router
        # This function just returns None to indicate failure
        return None

    db_subject = models.Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

# --- Teacher-Subject Assignment CRUD ---

# In app/crud.py

def create_teacher_subject_assignment(
    db: Session, assignment_data: schemas.TeacherSubjectAssignmentCreate
) -> models.TeacherSubjectAssignment | None: # Can now return None on failure
    """
    Creates the granular link between a teacher, subject, and division.
    Includes validation to ensure the batch belongs to the division.
    """
    # --- NEW: Validation Block ---
    if assignment_data.batch_id:
        # Fetch the batch from the database
        batch = db.query(models.Batch).filter(models.Batch.id == assignment_data.batch_id).first()
        
        # Check if batch exists and if its division_id matches the one in the request
        if not batch or batch.division_id != assignment_data.division_id:
            # If they don't match, the data is inconsistent. Return None to indicate failure.
            return None
    # --- End Validation Block ---

    db_assignment = models.TeacherSubjectAssignment(**assignment_data.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment




# Add these necessary imports to the top of your crud.py file
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from app import models, schemas
from app.utils import bert_utils, tfidf_utils, file_utils # Ensure these utils exist
import os

# --- Assignment CRUD ---

# In app/crud.py

import re # Make sure 're' is imported at the top of the file

# In app/crud.py

import re # Make sure 're' is imported at the top of the file
from typing import List, Tuple # Make sure Tuple is imported from typing

def create_assignment(
    db: Session, assignment_data: schemas.AssignmentCreate, teacher_id: int
) -> Tuple[models.Assignment, List[models.Student]]:
    """
    Creates a new assignment, generates 'pending' submissions, creates a notification
    for each student, and returns the assignment and the list of target students.
    """
    # 1. Create the main assignment object
    db_assignment = models.Assignment(**assignment_data.model_dump(), teacher_id=teacher_id)
    db.add(db_assignment)
    db.flush()
    db.refresh(db_assignment, attribute_names=["subject"])
    
    target_students = []
    if assignment_data.assignment_type == "Defaulter Assignment":
        # Logic for defaulters remains the same
        target_students = (
            db.query(models.Student).join(models.StudentSubjectStatus).filter(
                and_(
                    models.Student.division_id == assignment_data.division_id,
                    models.StudentSubjectStatus.subject_id == assignment_data.subject_id,
                    models.StudentSubjectStatus.attendance_percentage < 70
                )
            ).all()
        )
    elif not assignment_data.batch_id:
        # Division-Wide Assignment
        target_students = db.query(models.Student).filter(
            models.Student.division_id == assignment_data.division_id
        ).all()
    else:
       # Batch-Specific Assignment
        # UPDATED: Fetch students sorted by roll number
        all_students_in_division_sorted = db.query(models.Student).filter(
            models.Student.division_id == assignment_data.division_id
        ).order_by(models.Student.roll_number).all()
        
        all_batches_in_division = db.query(models.Batch).filter(
            models.Batch.division_id == assignment_data.division_id
        ).order_by(models.Batch.name).all()
        
        for student in all_students_in_division_sorted:
            # UPDATED: Pass the sorted list of students to the helper
            student_batch = calculate_student_batch(student, all_batches_in_division, all_students_in_division_sorted)
            if student_batch and student_batch.id == assignment_data.batch_id:
                target_students.append(student)

    # (The rest of the function to create submissions and notifications remains the same)
    for student in target_students:
        # Create the pending submission record
        pending_submission = models.AssignmentSubmission(
            assignment_id=db_assignment.id,
            student_id=student.id,
            status="pending"
            
        )
        db.add(pending_submission)

        # Create the notification record for the student
        notification_message = (
            f"New {db_assignment.assignment_type} posted for '{db_assignment.subject.name}': "
            f"'{db_assignment.title}'"
        )
        new_notification = models.Notification(
            student_id=student.id,
            subject_id=db_assignment.subject_id,
            message=notification_message
        )
        db.add(new_notification)
        
    db.commit()
    db.refresh(db_assignment)
    return db_assignment, target_students

def get_assignment_by_id(db: Session, assignment_id: int) -> models.Assignment | None:
    """Retrieves a single assignment by its ID."""
    return db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()

# In app/crud.py
from sqlalchemy.orm import aliased

# In app/crud.py
from sqlalchemy.orm import selectinload

# In app/crud.py
from sqlalchemy.orm import selectinload, joinedload

# In app/crud.py
from sqlalchemy import or_ # Make sure 'or_' is imported from sqlalchemy

# In app/crud.py

# In app/crud.py
from typing import List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas

# In app/crud.py
from typing import List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas

def get_assignments_for_student(db: Session, student: models.Student) -> List[dict]:
    """
    Retrieves and formats a precise list of assignments for a student to match
    the StudentAssignmentOut schema required by the frontend.
    """
    if not student.division_id:
        return []

    # 1. Get all necessary data for batch calculation
    all_batches = db.query(models.Batch).filter(models.Batch.division_id == student.division_id).order_by(models.Batch.name).all()
    all_students_sorted = db.query(models.Student).filter(models.Student.division_id == student.division_id).order_by(models.Student.roll_number).all()
    
    student_batch = calculate_student_batch(student, all_batches, all_students_sorted)
    student_batch_id = student_batch.id if student_batch else None
    
    # 2. Query the database for Assignments, joining the student's specific submission
    results = (
        db.query(models.Assignment, models.AssignmentSubmission)
        .outerjoin(
            models.AssignmentSubmission,
            and_(
                models.Assignment.id == models.AssignmentSubmission.assignment_id,
                models.AssignmentSubmission.student_id == student.id
            )
        )
        .options(
            joinedload(models.Assignment.subject),
            joinedload(models.Assignment.teacher),
        )
        .filter(models.Assignment.division_id == student.division_id)
        .filter(models.Assignment.status == "published")
        .filter(or_(models.Assignment.batch_id == None, models.Assignment.batch_id == student_batch_id))
        .order_by(models.Assignment.deadline.desc())
    ).all()
    
    # 3. Manually build the list of dictionaries to match the frontend's exact needs
    assignments_list = []
    for assignment, my_submission in results:
        assignments_list.append({
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "deadline": assignment.deadline,
            "assignment_type": assignment.assignment_type,
            "max_marks": assignment.max_marks,
            "assignment_file_path": assignment.assignment_file_path,
            "subject_name": assignment.subject.name,
            "teacher_name": assignment.teacher.name,
            "my_submission": my_submission
        })
        
    return assignments_list

def get_assignments_by_teacher(db: Session, teacher_id: int) -> List[dict]:
    """
    Retrieves and manually maps all assignments for a teacher to the detailed schema.
    This complex mapping is done here to keep the router clean.
    """
    assignments = (
        db.query(models.Assignment)
        .options(
            selectinload(models.Assignment.submissions).selectinload(models.AssignmentSubmission.student).selectinload(models.Student.user),
            joinedload(models.Assignment.teacher).joinedload(models.Teacher.user),
            joinedload(models.Assignment.subject).joinedload(models.Subject.department),
            joinedload(models.Assignment.division),
            joinedload(models.Assignment.batch),
        )
        .filter(models.Assignment.teacher_id == teacher_id)
        .order_by(models.Assignment.created_at.desc())
        .all()
    )
    
    # Manually construct the detailed response to match TeacherAssignmentDetail
    response_list = []
    for ass in assignments:
        response_list.append(map_assignment_to_detail_schema(ass))
    return response_list
    
def get_assignment_with_details(db: Session, assignment_id: int) -> dict | None:
    """Retrieves a single assignment and maps it to the detailed schema."""
    assignment = (
        db.query(models.Assignment)
        .options(
            selectinload(models.Assignment.submissions).selectinload(models.AssignmentSubmission.student).selectinload(models.Student.user),
            joinedload(models.Assignment.teacher).joinedload(models.Teacher.user),
            joinedload(models.Assignment.subject).joinedload(models.Subject.department),
            joinedload(models.Assignment.division),
            joinedload(models.Assignment.batch),
        )
        .filter(models.Assignment.id == assignment_id)
        .first()
    )
    if not assignment:
        return None
    return map_assignment_to_detail_schema(assignment)

def get_filtered_teacher_assignments(
    db: Session, teacher_id: int, subject_id: int | None,
    division_id: int | None, year: schemas.YearLevel | None,
    assignment_type: str | None
) -> List[dict]:
    """Filters a teacher's assignments based on provided criteria."""
    query = (
        db.query(models.Assignment)
        .join(models.Subject)
        .filter(models.Assignment.teacher_id == teacher_id)
        .options(
            selectinload(models.Assignment.submissions).selectinload(models.AssignmentSubmission.student).selectinload(models.Student.user),
            joinedload(models.Assignment.teacher).joinedload(models.Teacher.user),
            joinedload(models.Assignment.subject).joinedload(models.Subject.department),
            joinedload(models.Assignment.division),
            joinedload(models.Assignment.batch),
        )
    )
    
    if subject_id:
        query = query.filter(models.Assignment.subject_id == subject_id)
    if division_id:
        query = query.filter(models.Assignment.division_id == division_id)
    if year:
        query = query.filter(models.Subject.year == year)
    if assignment_type:
        query = query.filter(models.Assignment.assignment_type == assignment_type)
        
    assignments = query.order_by(models.Assignment.created_at.desc()).all()
    
    return assignments

# --- Submission CRUD & Business Logic ---

# In app/crud.py
import pytz
def update_student_submission(
    db: Session,
    assignment_id: int,
    student: models.Student,
    content: str,
    file_path: str | None,
    bert_score: float,
    plagiarism_fingerprint: str | None
) -> models.AssignmentSubmission | None:
    """
    Finds a pending submission and updates it, but first verifies the student
    is in the correct batch if the assignment is batch-specific.
    """
    assignment = db.query(models.Assignment).get(assignment_id)
    if not assignment:
        return None

    # --- BATCH AUTHORIZATION LOGIC ---
    if assignment.batch_id:
        # 1. Fetch all batches for the assignment's division
        all_batches_in_division = db.query(models.Batch).filter(
            models.Batch.division_id == assignment.division_id
        ).order_by(models.Batch.name).all()
        
        # 2. ADDED: Fetch the full list of students in the division, sorted
        all_students_in_division_sorted = db.query(models.Student).filter(
            models.Student.division_id == assignment.division_id
        ).order_by(models.Student.roll_number).all()

        # 3. Use the helper to calculate the student's batch
        student_batch = calculate_student_batch(
            student, 
            all_batches_in_division, 
            all_students_in_division_sorted
        )
        
        # 4. If the student's batch doesn't match the assignment's batch, fail
        if not student_batch or student_batch.id != assignment.batch_id:
            return None # Authorization failed

    # --- Original Submission Logic ---
    db_submission = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.student_id == student.id,
        models.AssignmentSubmission.status == "pending"
    ).first()

    if not db_submission:
        return None

    

    db_submission.content = content
    db_submission.file_path = file_path
    db_submission.bert_score = bert_score
    db_submission.marks = int(bert_score*100)

    db_submission.plagiarism_fingerprint = plagiarism_fingerprint
    db_submission.status = "submitted"
    
    db_submission.submitted_at = datetime.now(tz= pytz.timezone("Asia/Kolkata"))

    db.commit()
    db.refresh(db_submission)
    return db_submission

def grade_submission(
    db: Session, submission_id: int, grade_data: schemas.SubmissionGradeUpdate, teacher_id: int
) -> models.AssignmentSubmission | None:
    """Updates a submission with a manual grade and feedback from a teacher."""
    db_submission = db.query(models.AssignmentSubmission).options(
        joinedload(models.AssignmentSubmission.assignment)
    ).filter(models.AssignmentSubmission.id == submission_id).first()

    # Authorization: Ensure the teacher owns the assignment for this submission
    if not db_submission or db_submission.assignment.teacher_id != teacher_id:
        return None
        
    # Validate that the grade is not more than the max marks
    if grade_data.marks > db_submission.assignment.max_marks:
        # In a real app, you might raise a specific exception here
        return None

    db_submission.marks = grade_data.marks
    # You would need to add a 'feedback' column to your model for this to work
    # db_submission.feedback = grade_data.feedback 

    db.commit()
    db.refresh(db_submission)
    return db_submission

# --- Authorization Logic ---

# In app/crud.py

def verify_teacher_authority(
    db: Session, teacher_id: int, subject_id: int,
    division_id: int, batch_id: int | None, assignment_type: str
) -> bool:
    """
    Checks if a teacher has the correct authority to create a specific type
    of assignment for a subject that allows it.
    """
    # 1. First, get the subject to check its properties (has_lab, has_tw, etc.)
    subject = db.query(models.Subject).get(subject_id)
    if not subject:
        return False

    # 2. Base query to find the teacher's assignment to this group
    base_query = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id,
        models.TeacherSubjectAssignment.subject_id == subject_id,
        models.TeacherSubjectAssignment.division_id == division_id
    )

    # 3. Handle each assignment type with specific, granular checks
    if assignment_type in ["Theory Assignment", "Defaulter Assignment"]:
        # Teacher must have THEORY authority.
        authority = base_query.filter(
            models.TeacherSubjectAssignment.authority_type == models.AssignmentAuthorityType.THEORY
        ).first()
        return authority is not None
        
    elif assignment_type == "Home Assignment":
        # Subject must allow HAs, AND teacher must have THEORY authority.
        if not subject.has_ha:
            return False
        authority = base_query.filter(
            models.TeacherSubjectAssignment.authority_type == models.AssignmentAuthorityType.THEORY
        ).first()
        return authority is not None

    elif assignment_type == "Lab Assignment":
        # Subject must have a lab, AND teacher must have LAB authority for that batch.
        if not subject.has_lab or not batch_id:
            return False
        authority = base_query.filter(
            models.TeacherSubjectAssignment.batch_id == batch_id,
            models.TeacherSubjectAssignment.authority_type == models.AssignmentAuthorityType.LAB
        ).first()
        return authority is not None

    elif assignment_type == "Tutorial Assignment":
        # Subject must have a tutorial, AND teacher must have TUTORIAL authority for that batch.
        if not subject.has_tw or not batch_id:
            return False
        authority = base_query.filter(
            models.TeacherSubjectAssignment.batch_id == batch_id,
            models.TeacherSubjectAssignment.authority_type == models.AssignmentAuthorityType.TUTORIAL
        ).first()
        return authority is not None
        
    return False

# --- AI & Plagiarism Logic (Moved from Router) ---

# In app/crud.py


class SolutionFileNotFoundError(Exception):
    """Raised when the teacher's solution file for an assignment is missing."""
    pass

def calculate_bert_similarity(
    assignment: models.Assignment, text_to_check: str
) -> tuple[float, str | None]:
    """
    Calculates BERT similarity and returns the score and the sample text used.
    """
    if not assignment.solution_file_path or not os.path.exists(assignment.solution_file_path):
         raise SolutionFileNotFoundError("Teacher's solution file is not available for comparison.") # Return score and None for sample text

    solution_filename = os.path.basename(assignment.solution_file_path)
    
    solution_text = file_utils.extract_text(assignment.solution_file_path, solution_filename)
    
    print("Solution path:", assignment.solution_file_path)
    print("Exists:", os.path.exists(assignment.solution_file_path))

    
    if not solution_text:
        return 0.0, None
        
    score = bert_utils.compute_bert_similarity(text_to_check, solution_text)
    return score, solution_text # Return both the score and the text

# In app/crud.py

# Make sure these are imported at the top of your file
import os
from app.utils import file_utils, tfidf_utils
# In app/crud.py

# Ensure tfidf_utils is imported from your utils
from app.utils import tfidf_utils

# In app/crud.py
from app.utils import plagiarism_utils # Import the new utility

# In app/crud.py
from app.utils import plagiarism_utils # Import your new utility

# In app/crud.py
from typing import Tuple
from sqlalchemy.orm import Session
from app import models
# Make sure your plagiarism_utils is imported correctly
from app.utils import plagiarism_utils
from app.utils import levidistance
def check_plagiarism(db: Session, assignment_id: int, text_to_check: str) -> Tuple[bool, None]:
    """
    Checks for plagiarism by comparing the new submission's text against all
    previous submissions for the same assignment using a TF-IDF model.
    """
    # For TF-IDF, a high threshold is needed to detect direct copy-pasting
    PLAGIARISM_THRESHOLD = 0.80

    # 1. Fetch the content of all previously accepted submissions for this assignment
    previous_subs = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.status.in_(['submitted', 'late'])
    ).all()
    
    is_plagiarised = False
    
    # 2. Compare the new submission against each previous one
    for sub in previous_subs:
        if sub.content: # Ensure there is content to compare against
            
            # Call the pure TF-IDF similarity function
            similarity_score = plagiarism_utils.calculate_tfidf_similarity(text_to_check, sub.content)

            print(f"Comparing against submission {sub.id}. TF-IDF Score: {similarity_score:.2f}")

            if similarity_score >= PLAGIARISM_THRESHOLD:
                is_plagiarised = True
                break # Stop checking as soon as a high-confidence match is found
        
    # 3. There is no fingerprint to generate or return in a pure TF-IDF system.
    # We return the plagiarism flag and None.
    return is_plagiarised, None

# --- Helper Function for Data Mapping ---

def map_assignment_to_detail_schema(assignment: models.Assignment) -> dict:
    """Helper to manually map a complex SQLAlchemy object to a Pydantic-like dict."""
    submissions = []
    for sub in assignment.submissions:
        submissions.append({
            "id": sub.id,
            "student": sub.student, # Pydantic will handle nested serialization
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            
            "marks": sub.marks,
            "feedback": None, # Add a source for feedback if it exists
            "file_path": sub.file_path,
        })

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "subject": assignment.subject,
        "division": assignment.division,
        "batch": assignment.batch,
        "deadline": assignment.deadline,
        "created_at": assignment.created_at,
        "max_marks": assignment.max_marks,
        "instructions": assignment.instructions,
        "status": assignment.status,
        "teacher": assignment.teacher,
        "assignment_type": assignment.assignment_type,
        "submissions": submissions,
        "assignment_file_path": assignment.assignment_file_path,
        "solution_file_path": assignment.solution_file_path,
    }



# In app/crud.py

import os # Make sure 'os' is imported at the top of the file
from sqlalchemy.orm import Session
from app import models



def delete_assignment(db: Session, assignment_id: int, teacher_id: int) -> models.Assignment | None:
    """
    Deletes an assignment, its associated files, and cascades the delete
    to all its submission records and their files.
    """
    # Find the assignment and eagerly load its submissions
    db_assignment = (
        db.query(models.Assignment)
        .options(selectinload(models.Assignment.submissions))
        .filter(models.Assignment.id == assignment_id)
        .first()
    )
    
    # Verify ownership
    if not db_assignment or db_assignment.teacher_id != teacher_id:
        return None
    
    # --- NEW: Delete files for all submissions FIRST ---
    for submission in db_assignment.submissions:
        if submission.file_path and os.path.exists(submission.file_path):
            try:
                os.remove(submission.file_path)
            except OSError:
                # Log this error in a real application
                pass 
    
    # Delete the assignment's own files
    if db_assignment.assignment_file_path and os.path.exists(db_assignment.assignment_file_path):
        os.remove(db_assignment.assignment_file_path)
    if db_assignment.solution_file_path and os.path.exists(db_assignment.solution_file_path):
        os.remove(db_assignment.solution_file_path)

    # Now, delete the assignment record from the database.
    # The 'cascade' option will handle deleting the submission records.
    db.delete(db_assignment)
    db.commit()
    
    return db_assignment



# In app/crud.py

from sqlalchemy.orm import joinedload

def get_assignment_with_details(db: Session, assignment_id: int) -> models.Assignment | None:
    """
    Retrieves a single assignment by its ID, eagerly loading all related
    academic structure information needed for path creation.
    """
    return (
        db.query(models.Assignment)
        .options(
            joinedload(models.Assignment.subject).joinedload(models.Subject.department),
            joinedload(models.Assignment.division),
            joinedload(models.Assignment.batch),
        )
        .filter(models.Assignment.id == assignment_id)
        .first()
    )



# Add this function to your app/crud.py file

def publish_assignment(db: Session, assignment_id: int, teacher_id: int) -> models.Assignment | None:
    """
    Changes an assignment's status to 'published'.
    Performs an ownership check to ensure the requesting teacher is the owner.
    """
    # Find the assignment by its ID
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    
    # Verify that the assignment exists AND belongs to the current teacher
    if not db_assignment or db_assignment.teacher_id != teacher_id:
        return None
        
    # Update the status
    db_assignment.status = "published"
    
    # Commit the change and refresh the object
    db.commit()
    db.refresh(db_assignment)
    
    return db_assignment



from app.core.security import get_password_hash # Ensure this is imported

# In app/crud.py

def create_student_user(db: Session, student_data: schemas.StudentSignup) -> models.Student:
    """
    Creates a new User account, its associated Student profile, and automatically
    creates a StudentSubjectStatus record for every subject in the student's division.
    """
    # 1. Create the User account and Student profile
    hashed_password = get_password_hash(student_data.user.password)
    db_user = models.User(
        email=student_data.user.email,
        hashed_password=hashed_password,
        role=models.UserRole.student
    )
    db_student_profile = models.Student(
        name=student_data.name,
        roll_number=student_data.roll_number,
        year=student_data.year,
        division_id=student_data.division_id,
        user=db_user
    )
    db.add(db_student_profile)
    
    # 2. If the student was assigned to a division, create the status records
    if student_data.division_id:
        # Use flush to get the new student's ID before the final commit
        db.flush() 

        # 3. Find the division to get its department and year
        division = db.query(models.Division).filter(models.Division.id == student_data.division_id).first()
        
        if division:
            # 4. Find all subjects that match the division's department and year
            subjects_for_division = db.query(models.Subject).filter(
                models.Subject.department_id == division.department_id,
                models.Subject.year == division.year
            ).all()

            # 5. Loop through the subjects and create a status record for each one
            for subject in subjects_for_division:
                status_record = models.StudentSubjectStatus(
                    student_id=db_student_profile.id,
                    subject_id=subject.id
                )
                db.add(status_record)

    # 6. Commit the transaction to save everything (User, Student, and all Status records)
    db.commit()
    db.refresh(db_student_profile)
    return db_student_profile


# Add these functions to your app/crud.py file

from sqlalchemy.orm import selectinload
from datetime import datetime

def get_sce_details_for_division(
    db: Session, subject_id: int, division_id: int
) -> List[models.StudentSubjectStatus]:
    """
    Fetches all SCE status records for every student in a given division for a specific subject.
    """
    return (
        db.query(models.StudentSubjectStatus)
        .join(models.Student)
        .filter(
            models.StudentSubjectStatus.subject_id == subject_id,
            models.Student.division_id == division_id
        )
        .options(
            selectinload(models.StudentSubjectStatus.student).selectinload(models.Student.user),
            selectinload(models.StudentSubjectStatus.subject)
        )
        .all()
    )


# In app/crud.py
import re # Make sure 're' is imported

# In app/crud.py

# In app/crud.py

# In app/crud.py

def get_sce_details_for_teacher(
    db: Session, teacher_id: int, subject_id: int, division_id: int
) -> dict:
    """
    Fetches SCE records for a division and correctly categorizes them into 'can_update'
    and 'can_view_only' lists based on the teacher's specific authorities.
    """
    # 1. Get all of the teacher's authorities for this specific subject/division
    authorities = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id,
        models.TeacherSubjectAssignment.subject_id == subject_id,
        models.TeacherSubjectAssignment.division_id == division_id
    ).all()

    if not authorities:
        return {"can_update": [], "can_view_only": []}

    # 2. Determine the teacher's rights
    has_theory_auth = any(a.authority_type == models.AssignmentAuthorityType.THEORY for a in authorities)
    updateable_batch_ids = {
        a.batch_id for a in authorities 
        if a.authority_type in [models.AssignmentAuthorityType.LAB, models.AssignmentAuthorityType.TUTORIAL]
    }

    # 3. Fetch all necessary data once to be efficient
    all_sce_records = get_sce_details_for_division(db, subject_id, division_id)
    if not all_sce_records:
        return {"can_update": [], "can_view_only": []}
        
    all_batches_in_division = db.query(models.Batch).filter(models.Batch.division_id == division_id).order_by(models.Batch.name).all()
    all_students_in_division_sorted = db.query(models.Student).filter(
        models.Student.division_id == division_id
    ).order_by(models.Student.roll_number).all()
    
    can_update_list = []
    can_view_only_list = []
    
    # 4. Create a map of student IDs to their SCE records for easy lookup
    sce_map = {record.student_id: record for record in all_sce_records}

    # 5. Loop through the definitive, sorted list of students in the division
    for student in all_students_in_division_sorted:
        record = sce_map.get(student.id)
        if not record:
            continue # Skip if student has no SCE record

        # Calculate the student's batch
        student_batch = calculate_student_batch(
            student, 
            all_batches_in_division, 
            all_students_in_division_sorted
        )
        student_batch_id = student_batch.id if student_batch else None

        # 6. Categorize the record
        # A student can be updated if their specific batch is in the teacher's updateable list
        if student_batch_id in updateable_batch_ids:
            can_update_list.append(record)
        # Otherwise, if the teacher has theory rights, they can view the record
        elif has_theory_auth:
            can_view_only_list.append(record)
            
    return {"can_update": can_update_list, "can_view_only": can_view_only_list}
    











def _recalculate_single_student_noc(db: Session, record: models.StudentSubjectStatus):
    """
    Internal helper to recalculate and update NOC status for a single student record.
    """
    student_id = record.student_id
    subject = record.subject
    
    # 1. Fetch Assignments & Submissions
    all_assignments = db.query(models.Assignment).filter(
        models.Assignment.subject_id == subject.id
    ).all()
    
    all_submissions = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id == student_id,
        models.AssignmentSubmission.assignment_id.in_([a.id for a in all_assignments])
    ).all()
    
    submitted_ids = {s.assignment_id for s in all_submissions if s.status in ['submitted', 'late']}
    
    # 2. Categorize Assignments
    theory_req_ids = {a.id for a in all_assignments if a.assignment_type == "Theory Assignment"}
    ha_req_ids = {a.id for a in all_assignments if a.assignment_type == "Home Assignment"}
    lab_req_ids = {a.id for a in all_assignments if a.assignment_type == "Lab Assignment"}
    tut_req_ids = {a.id for a in all_assignments if a.assignment_type == "Tutorial Assignment"}
    defaulter_assign_id = next((a.id for a in all_assignments if a.assignment_type == "Defaulter Assignment"), None)

    # 3. Check Assignments Completion (Default to True if no assignments exist)
    theory_assign_ok = theory_req_ids.issubset(submitted_ids) if theory_req_ids else True
    lab_assign_ok = lab_req_ids.issubset(submitted_ids) if lab_req_ids else True
    tut_assign_ok = tut_req_ids.issubset(submitted_ids) if tut_req_ids else True
    ha_ok = ha_req_ids.issubset(submitted_ids) if ha_req_ids else True

    # 4. Check SCE Components
    applicable_sce_statuses = []
    if subject.has_pbl: applicable_sce_statuses.append(record.pbl_status)
    if subject.has_sce_presentation: applicable_sce_statuses.append(record.presentation_status)
    if subject.has_sce_certificate: applicable_sce_statuses.append(record.certification_status)
    
    sce_ok = all(s == models.SCEStatus.completed for s in applicable_sce_statuses) if applicable_sce_statuses else True
    
    # 5. Check Attendance (Theory, Lab, Tutorial)
    ATTENDANCE_LIMIT = 75.0
    
    theory_attendance_ok = record.attendance_percentage >= ATTENDANCE_LIMIT
    
    # --- NEW CHECKS: Lab and Tutorial Attendance ---
    # Default to True (OK) if the subject doesn't have a Lab/Tutorial
    lab_attendance_ok = True
    if subject.has_lab:
        # Check percentage if it exists, otherwise assume 0
        current_lab_att = record.lab_attendance_percentage if record.lab_attendance_percentage is not None else 0.0
        lab_attendance_ok = current_lab_att >= ATTENDANCE_LIMIT
        
    tut_attendance_ok = True
    if subject.has_tw:
        current_tut_att = record.tutorial_attendance_percentage if record.tutorial_attendance_percentage is not None else 0.0
        tut_attendance_ok = current_tut_att >= ATTENDANCE_LIMIT
    # ------------------------------------------------

    defaulter_completed = defaulter_assign_id in submitted_ids if defaulter_assign_id else False
    cie_ok = not subject.has_cie or record.marks_cie is not None
    
    # 6. Determine Final NOC Compliance
    
    # --- Theory NOC Logic ---
    theory_reqs_met = False
    if theory_attendance_ok:
        theory_reqs_met = all([cie_ok, ha_ok, theory_assign_ok])
    else:
        # Low attendance -> Must complete defaulter assignment
        theory_reqs_met = defaulter_completed and all([cie_ok, ha_ok, theory_assign_ok])
        
    # --- Lab/Tutorial NOC Logic ---
    # Must meet SCE + Assignments + Attendance
    lab_tut_reqs_met = sce_ok
    
    if subject.has_lab: 
        # UPDATED: Now checks lab_attendance_ok
        lab_tut_reqs_met = lab_tut_reqs_met and lab_assign_ok and lab_attendance_ok
        
    if subject.has_tw: 
        # UPDATED: Now checks tut_attendance_ok
        lab_tut_reqs_met = lab_tut_reqs_met and tut_assign_ok and tut_attendance_ok
    
    # 7. Update Status (Only if not locked)
    if record.theory_noc_status not in [models.NocStatus.GRANTED, models.NocStatus.REFUSED]:
        new_theory = models.NocStatus.COMPLETED if theory_reqs_met else models.NocStatus.PENDING
        if record.theory_noc_status != new_theory:
            record.theory_noc_status = new_theory
    
    if record.lab_tut_noc_status not in [models.NocStatus.GRANTED, models.NocStatus.REFUSED]:
        new_lab_tut = models.NocStatus.COMPLETED if lab_tut_reqs_met else models.NocStatus.PENDING
        if record.lab_tut_noc_status != new_lab_tut:
            record.lab_tut_noc_status = new_lab_tut



# --- UPDATED FUNCTION ---
def update_sce_details(
    db: Session, update_data: schemas.MarksUpdateRequest
) -> models.StudentSubjectStatus | None:
    """
    Finds and updates a student's SCE/marks record for a specific subject.
    Also recalculates the NOC status to reflect these changes immediately.
    """
    # 1. Fetch the record with Subject loaded (needed for recalculation rules)
    db_record = db.query(models.StudentSubjectStatus).options(
        joinedload(models.StudentSubjectStatus.subject)
    ).filter(
        models.StudentSubjectStatus.student_id == update_data.student_id,
        models.StudentSubjectStatus.subject_id == update_data.subject_id
    ).first()

    if not db_record:
        return None

    # 2. Apply the updates from the request
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        if hasattr(db_record, key):
            setattr(db_record, key, value)
    
    db_record.last_updated = datetime.utcnow()

    # 3. --- NEW: Trigger NOC Recalculation ---
    # This ensures that if Presentation changes to Pending, the NOC status updates immediately.
    _recalculate_single_student_noc(db, db_record)
    
    # 4. Commit and Refresh
    db.commit()
    db.refresh(db_record)
    return db_record




# In app/crud.py

def backfill_student_sce_records(db: Session, student_ids: List[int]) -> dict:
    """
    Backfills missing StudentSubjectStatus records for a list of student IDs.
    This is an idempotent operation; it will not create duplicate records.
    """
    records_created = 0
    students_processed = 0
    students_skipped = 0

    # Fetch all students to be processed
    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()

    for student in students:
        students_processed += 1
        # Skip students who are not assigned to a division
        if not student.division_id:
            students_skipped += 1
            continue

        # Find all subjects that match the student's division's department and year
        subjects_for_division = db.query(models.Subject).filter(
            models.Subject.department_id == student.division.department_id,
            models.Subject.year == student.division.year
        ).all()

        for subject in subjects_for_division:
            # Check if a status record ALREADY exists for this student and subject
            existing_record = db.query(models.StudentSubjectStatus).filter(
                models.StudentSubjectStatus.student_id == student.id,
                models.StudentSubjectStatus.subject_id == subject.id
            ).first()
            
            # If no record exists, create a new one
            if not existing_record:
                new_record = models.StudentSubjectStatus(
                    student_id=student.id,
                    subject_id=subject.id
                )
                db.add(new_record)
                records_created += 1

    db.commit()
    
    return {
        "message": "Backfill process completed.",
        "records_created": records_created,
        "students_processed": students_processed,
        "students_skipped": students_skipped
    }





# Add these two new functions to your app/crud.py file
import re # Make sure re is imported

def has_any_division_authority(db: Session, teacher_id: int, subject_id: int, division_id: int) -> bool:
    """
    Checks if a teacher is assigned to a subject/division in ANY capacity
    (Theory, Lab, or Tutorial). Used for read-only access.
    """
    assignment = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id,
        models.TeacherSubjectAssignment.subject_id == subject_id,
        models.TeacherSubjectAssignment.division_id == division_id
    ).first()
    return assignment is not None

def verify_batch_level_sce_authority(db: Session, teacher_id: int, subject_id: int, student_id: int) -> bool:
    """
    Verifies if a teacher has Lab/Tutorial authority over a specific student's
    calculated batch. Used for write/update access.
    """
    student = db.query(models.Student).get(student_id)
    if not student or not student.division_id:
        return False

    # --- SIMPLIFIED BATCH CALCULATION ---
    # 1. Fetch all batches for the division
    all_batches_in_division = db.query(models.Batch).filter(
        models.Batch.division_id == student.division_id
    ).order_by(models.Batch.name).all()

    all_students_in_division_sorted = db.query(models.Student).filter(
        models.Student.division_id == student.division_id
    ).order_by(models.Student.roll_number).all()

    # 3. Use the helper to calculate the student's batch
    student_batch = calculate_student_batch(student, all_batches_in_division, all_students_in_division_sorted)
    # 2. Use the new helper function to get the student's batch object
    
    
    if not student_batch:
        return False # Student could not be assigned to a batch
        
    student_batch_id = student_batch.id
    # ------------------------------------

    # 3. Check if the teacher has authority for that specific batch
    authority = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id,
        models.TeacherSubjectAssignment.subject_id == subject_id,
        models.TeacherSubjectAssignment.division_id == student.division_id,
        models.TeacherSubjectAssignment.batch_id == student_batch_id,
        models.TeacherSubjectAssignment.authority_type.in_([
            models.AssignmentAuthorityType.LAB,
            models.AssignmentAuthorityType.TUTORIAL
        ])
    ).first()
    
    return authority is not None


# In app/crud.py

# Make sure these are imported at the top of your file
from typing import List
from app.core.security import get_password_hash

# In app/crud.py

def batch_create_student_users(db: Session, signup_data: schemas.StudentBatchSignup) -> dict:
    """
    Creates multiple student users and profiles in a single batch, and also
    creates their associated StudentSubjectStatus records.
    """
    successful_creates = 0
    failed_emails = []
    records_created = 0
    
    # 1. Efficiently pre-fetch all existing user emails
    existing_emails_query = db.query(models.User.email).all()
    existing_emails = {email for (email,) in existing_emails_query}

    # 2. Efficiently pre-fetch all subjects and group them by division
    all_subjects = db.query(models.Subject).all()
    subjects_by_division = {}
    for subject in all_subjects:
        key = (subject.department_id, subject.year)
        if key not in subjects_by_division:
            subjects_by_division[key] = []
        subjects_by_division[key].append(subject)

    # 3. Pre-fetch division info
    all_divisions = {div.id: div for div in db.query(models.Division).all()}

    new_student_profiles = [] # Temporarily hold new students

    # First loop: Create User and Student objects in memory, checking for duplicates
    for student_data in signup_data.students:
        student_email = student_data.user.email
        if student_email in existing_emails:
            failed_emails.append(student_email)
            continue
        
        hashed_password = get_password_hash(student_data.user.password)
        db_user = models.User(
            email=student_email,
            hashed_password=hashed_password,
            role=models.UserRole.student
        )
        db_student_profile = models.Student(
            name=student_data.name,
            roll_number=student_data.roll_number,
            year=student_data.year,
            division_id=student_data.division_id,
            user=db_user
        )
        db.add(db_student_profile)
        new_student_profiles.append(db_student_profile)
        existing_emails.add(student_email)
        successful_creates += 1

    # Flush to assign IDs to the new students so we can link status records
    db.flush()

    # Second loop: Create the StudentSubjectStatus records
    for student_profile in new_student_profiles:
        if student_profile.division_id:
            division = all_divisions.get(student_profile.division_id)
            if division:
                key = (division.department_id, division.year)
                subjects_to_add = subjects_by_division.get(key, [])
                
                for subject in subjects_to_add:
                    status_record = models.StudentSubjectStatus(
                        student_id=student_profile.id,
                        subject_id=subject.id
                    )
                    db.add(status_record)
                    records_created += 1
    
    db.commit()
    
    return {
        "message": "Batch signup process completed.",
        "successful_creates": successful_creates,
        "failed_emails": failed_emails,
        "sce_records_created": records_created,
        "students_processed": len(signup_data.students)
    }



# In app/crud.py

# def get_noc_details_for_teacher(db: Session, teacher_id: int, subject_id: int, division_id: int) -> List[dict]:
#     # 1. Get all of the teacher's authorities for this subject/division
#     authorities = db.query(models.TeacherSubjectAssignment).filter(
#         models.TeacherSubjectAssignment.teacher_id == teacher_id,
#         models.TeacherSubjectAssignment.subject_id == subject_id,
#         models.TeacherSubjectAssignment.division_id == division_id
#     ).all()

#     if not authorities:
#         return []

#     has_theory_auth = any(a.authority_type == models.AssignmentAuthorityType.THEORY for a in authorities)
#     updateable_batch_ids = {a.batch_id for a in authorities if a.authority_type in [models.AssignmentAuthorityType.LAB, models.AssignmentAuthorityType.TUTORIAL]}

#     # 2. Get all SCE/Status records for the division, with student and subject info
#     all_status_records = get_sce_details_for_division(db, subject_id, division_id)
    
#     all_batches_in_division = db.query(models.Batch).filter(models.Batch.division_id == division_id).order_by(models.Batch.name).all()
    
#     response_list = []
#     for record in all_status_records:
#         student = record.student
#         subject = record.subject

#         # --- Create the Theory Row ---
#         theory_row = {
#             "status_record_id": record.id,
#             "student": student,
#             "noc_type": "Theory",
#             "attendance": {"status": f"{record.attendance_percentage}%", "is_applicable": True},
#             "cie": {"status": "Completed" if record.marks_cie is not None else "Pending", "is_applicable": subject.has_cie},
#             "home_assignment": {"status": "Completed" if record.marks_ha is not None else "Pending", "is_applicable": subject.has_ha},
#             "lab_tutorial_assignment": {"status": "N/A", "is_applicable": False},
#             "sce_status": {"status": "N/A", "is_applicable": False},
#             "final_noc_status": "Eligible" if record.is_noc_eligible else "Not Eligible",
#             "is_updatable": has_theory_auth
#         }
#         response_list.append(theory_row)

#         # --- Create the Lab/Tutorial Row ---
#         # Calculate student's batch
#         student_batch_id = None
#         if student.roll_number and all_batches_in_division:
#             try:
#                 num_batches = len(all_batches_in_division)
#                 batch_id_map = {i: batch.id for i, batch in enumerate(all_batches_in_division)}
#                 numeric_roll = int(re.search(r'\d+$', student.roll_number).group())
#                 batch_index = (numeric_roll - 1) % num_batches
#                 student_batch_id = batch_id_map.get(batch_index)
#             except (ValueError, AttributeError):
#                 student_batch_id = None

#         lab_tut_applicable = subject.has_tw or subject.has_lab
#         lab_tut_status = "Completed" if record.marks_tw is not None else "Pending"
        
#         sce_components = [subject.has_pbl, subject.has_sce_presentation, subject.has_sce_certificate]
#         sce_applicable = any(sce_components)
#         sce_statuses = [record.pbl_status, record.presentation_status, record.certification_status]
#         sce_complete = all(s == models.SCEStatus.completed for s in sce_statuses)
#         sce_status = "Completed" if sce_complete else "Incomplete"
        
#         lab_tut_row = {
#             "status_record_id": record.id,
#             "student": student,
#             "noc_type": "Lab/Tutorial",
#             "attendance": {"status": "N/A", "is_applicable": False},
#             "cie": {"status": "N/A", "is_applicable": False},
#             "home_assignment": {"status": "N/A", "is_applicable": False},
#             "lab_tutorial_assignment": {"status": lab_tut_status, "is_applicable": lab_tut_applicable},
#             "sce_status": {"status": sce_status, "is_applicable": sce_applicable},
#             "final_noc_status": "Eligible" if record.is_noc_eligible else "Not Eligible",
#             "is_updatable": student_batch_id in updateable_batch_ids
#         }
#         response_list.append(lab_tut_row)
        
#     return response_list


# In app/crud.py

# In app/crud.py

from typing import List, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
import re
import math

# In app/crud.py
import re
import math
from typing import List, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas

def get_noc_details_for_teacher(db: Session, teacher_id: int, subject_id: int, division_id: int) -> List[dict]:
    """
    A read-only function to fetch and format the current NOC data for the UI,
    including the teacher's specific update permissions for each row.
    """
    # 1. Get the teacher's authorities for this specific subject/division
    authorities = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id,
        models.TeacherSubjectAssignment.subject_id == subject_id,
        models.TeacherSubjectAssignment.division_id == division_id
    ).all()

    if not authorities:
        return []

    # 2. Determine the teacher's rights for easy lookup
    has_theory_auth = any(a.authority_type == models.AssignmentAuthorityType.THEORY for a in authorities)
    updateable_batches = {
        a.batch_id: a.authority_type for a in authorities 
        if a.authority_type in [models.AssignmentAuthorityType.LAB, models.AssignmentAuthorityType.TUTORIAL]
    }

    # 3. Pre-fetch all necessary data
    all_sce_records = get_sce_details_for_division(db, subject_id, division_id)
    if not all_sce_records:
        return []
    
    student_ids = [rec.student.id for rec in all_sce_records]
    all_batches_in_division = db.query(models.Batch).filter(models.Batch.division_id == division_id).order_by(models.Batch.name).all()
    all_students_in_division_sorted = db.query(models.Student).filter(
        models.Student.division_id == division_id
    ).order_by(models.Student.roll_number).all()
    
    all_assignments_for_subject = db.query(models.Assignment).filter(
        models.Assignment.subject_id == subject_id
    ).all()
    
    # CORRECTED: Use the 'student_ids' list in the query
    all_submissions_for_students = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id.in_(student_ids),
        models.AssignmentSubmission.assignment_id.in_([a.id for a in all_assignments_for_subject])
    ).all()
    
    submissions_by_student = {}
    for sub in all_submissions_for_students:
        if sub.student_id not in submissions_by_student:
            submissions_by_student[sub.student_id] = []
        submissions_by_student[sub.student_id].append(sub)

    response_list = []      
    # 4. Process each student's record and build the response rows
    for record in all_sce_records:
        student = record.student
        subject = record.subject

        # Calculate the student's batch to check Lab/Tutorial permissions
        student_batch = calculate_student_batch(student, all_batches_in_division, all_students_in_division_sorted)
        student_batch_id = student_batch.id if student_batch else None
      
        
        # --- Start Calculation Logic ---
        student_submissions = submissions_by_student.get(student.id, [])
        submitted_ids = {s.assignment_id for s in student_submissions if s.status in ['submitted', 'late']}
        
        # Get sets of required assignment IDs for each type
        theory_req_ids = {a.id for a in all_assignments_for_subject if a.assignment_type == "Theory Assignment"}
        ha_req_ids = {a.id for a in all_assignments_for_subject if a.assignment_type == "Home Assignment"}
        lab_req_ids = {a.id for a in all_assignments_for_subject if a.assignment_type == "Lab Assignment"}
        tut_req_ids = {a.id for a in all_assignments_for_subject if a.assignment_type == "Tutorial Assignment"}
        

        # --- Check Completion Status for Each Component based on your rules ---
        
        # Rule 1: Theory Assignments
        theory_assign_ok = theory_req_ids.issubset(submitted_ids) if theory_req_ids else False

        # Rule 2: Lab & Tutorial Assignments
        lab_assign_ok = None if not lab_req_ids else lab_req_ids.issubset(submitted_ids)    
        
        tut_assign_ok = None if not tut_req_ids else tut_req_ids.issubset(submitted_ids) 
           
            
        
        # Rule 3: SCE Components
        applicable_sce_statuses = []
        if subject.has_pbl: applicable_sce_statuses.append(record.pbl_status)
        if subject.has_sce_presentation: applicable_sce_statuses.append(record.presentation_status)
        if subject.has_sce_certificate: applicable_sce_statuses.append(record.certification_status)
        sce_ok = all(s == models.SCEStatus.completed for s in applicable_sce_statuses) if applicable_sce_statuses else True
        


         # --- ADD THIS DEBUG BLOCK ---
        print("="*30)
        print(f"DEBUG for Student ID: {student.id}, Subject: {subject.name}")
        print(f"  - Subject requires PBL: {subject.has_pbl} (Status: {record.pbl_status.value})")
        print(f"  - Subject requires Presentation: {subject.has_sce_presentation} (Status: {record.presentation_status.value})")
        print(f"  - Subject requires Certificate: {subject.has_sce_certificate} (Status: {record.certification_status.value})")
        print(f"  - Applicable statuses being checked: {[s.value for s in applicable_sce_statuses]}")
        print(f"  - Final 'sce_ok' result: {sce_ok}")
        print("="*30)
        # ---------------------------
        
        # Rule 4: Defaulter Assignment (only relevant if attendance is low)
        attendance_ok = record.attendance_percentage >= 70
        

        # Rule 5: Home Assignment
        ha_ok = None if not ha_req_ids else ha_req_ids.issubset(submitted_ids) 

        # Rule 6: CIE
        cie_ok = not subject.has_cie or record.marks_cie is not None
        # Determine defaulter status for the Theory row
        
        ATTENDANCE_THRESHOLD = 70.0
        
        
        if record.attendance_percentage < ATTENDANCE_THRESHOLD:
            defaulter_assignment = next(
                (a for a in all_assignments_for_subject if a.assignment_type == "Defaulter Assignment"), 
                None
            )

            defaulter_assignment_completed = False
            if defaulter_assignment:
                student_submissions = submissions_by_student.get(student.id, [])
                submitted_ids = {s.assignment_id for s in student_submissions if s.status in ['submitted', 'late']}
                if defaulter_assignment.id in submitted_ids:
                    defaulter_assignment_completed = True

            defaulter_status_for_theory = {
                "status": "Completed" if defaulter_assignment_completed else "Pending",
                "is_applicable": True if defaulter_assignment else False
            }
        else:
            defaulter_status_for_theory = {
                "status": "N/A",
                "is_applicable": False
            }

            
        # --- Construct and Append Theory Row ---
        theory_row = {
            "status_record_id": record.id,
            "student": student,
            "noc_type": "Theory",
            "attendance": {"status": f"{record.attendance_percentage or 0.0}%", "is_applicable": True},
            "cie": {"status": "Completed" if cie_ok is True else "Pending", "is_applicable": subject.has_cie},
            "home_assignment": {"status": "Completed" if ha_ok else ( "N/A" if ha_ok is None  else "Pending"), "is_applicable": subject.has_ha},
            "assignments": {"status": "N/A", "is_applicable": False}, # Placeholder, real status calculated elsewhere
            "defaulter_assignment": defaulter_status_for_theory,
            "sce_status": {"status": "N/A", "is_applicable": False},
            "noc_status": record.theory_noc_status.value,
            "is_updatable": has_theory_auth
        }
        response_list.append(theory_row)

        # --- Conditionally Construct Lab Row ---
        if subject.has_lab:
            can_update_lab = updateable_batches.get(student_batch_id) == models.AssignmentAuthorityType.LAB
            lab_row = {
                "status_record_id": record.id,
                "student": student,
                "noc_type": "Lab",
                "attendance": {"status": f"{record.lab_attendance_percentage or 0.0}%", "is_applicable": True},
                "cie": {"status": "N/A", "is_applicable": False},
                "home_assignment": {"status": "N/A", "is_applicable": False},
                "assignments": {    "status": "Completed" if lab_assign_ok else ("N/A" if lab_assign_ok is None else "Pending"), "is_applicable": True}, # Placeholder
                "defaulter_assignment": defaulter_status_for_theory,
                "sce_status": {"status":"Completed" if sce_ok is True  else "Pending" , "is_applicable": True}, # Placeholder
                "noc_status": record.lab_tut_noc_status.value,
                "is_updatable": can_update_lab
            }
            response_list.append(lab_row)
        
        # --- Conditionally Construct Tutorial Row ---
        if subject.has_tw:
            can_update_tut = updateable_batches.get(student_batch_id) == models.AssignmentAuthorityType.TUTORIAL
            tutorial_row = {
                "status_record_id": record.id,
                "student": student,
                "noc_type": "Tutorial",
                "attendance": {"status": f"{record.tutorial_attendance_percentage or 0.0}%", "is_applicable": True},
                "cie": {"status": "N/A", "is_applicable": False},
                "home_assignment": {"status": "N/A", "is_applicable": False},
                "assignments": {"status": "Completed" if tut_assign_ok else ("N/A" if tut_assign_ok is None else "Pending"), "is_applicable": True}, # Placeholder
                "defaulter_assignment": defaulter_status_for_theory,
                "sce_status": {"status": "Completed" if sce_ok is True  else "Pending", "is_applicable": True}, # Placeholder
                "noc_status": record.lab_tut_noc_status.value,
                "is_updatable": can_update_tut
            }
            response_list.append(tutorial_row)
            
    return response_list


# In app/crud.py
from typing import List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
import re
import math

# In app/crud.py
from typing import List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from app import models

def recalculate_noc_statuses(db: Session, subject_id: int, division_id: int) -> int:
    """
    Recalculates the 'Pending'/'Completed' status for all students in a group
    based on a strict set of rules. This is a write operation.
    """
    # 1. Pre-fetch all necessary data to be efficient
    all_sce_records = get_sce_details_for_division(db, subject_id, division_id)
    if not all_sce_records:
        return 0
        
    student_ids = [rec.student.id for rec in all_sce_records]
    all_assignments = db.query(models.Assignment).filter(models.Assignment.subject_id == subject_id).all()
    all_submissions = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id.in_(student_ids),
        models.AssignmentSubmission.assignment_id.in_([a.id for a in all_assignments])
    ).all()
    
    submissions_by_student = {}
    for sub in all_submissions:
        if sub.student_id not in submissions_by_student: submissions_by_student[sub.student_id] = []
        submissions_by_student[sub.student_id].append(sub)

    records_updated = 0
    # 2. Process each student's record
    for record in all_sce_records:
        student = record.student
        subject = record.subject
        
        # --- Start Calculation Logic ---
        student_submissions = submissions_by_student.get(student.id, [])
        submitted_ids = {s.assignment_id for s in student_submissions if s.status in ['submitted', 'late']}
        
        # Get sets of required assignment IDs for each type
        theory_req_ids = {a.id for a in all_assignments if a.assignment_type == "Theory Assignment"}
        ha_req_ids = {a.id for a in all_assignments if a.assignment_type == "Home Assignment"}
        lab_req_ids = {a.id for a in all_assignments if a.assignment_type == "Lab Assignment"}
        tut_req_ids = {a.id for a in all_assignments if a.assignment_type == "Tutorial Assignment"}
        defaulter_assign_id = next((a.id for a in all_assignments if a.assignment_type == "Defaulter Assignment"), None)

        # --- Check Completion Status for Each Component based on your rules ---
        
        # Rule 1: Theory Assignments
        theory_assign_ok = theory_req_ids.issubset(submitted_ids) if theory_req_ids else False

        # Rule 2: Lab & Tutorial Assignments
        lab_assign_ok = lab_req_ids.issubset(submitted_ids) if lab_req_ids else False
        tut_assign_ok = tut_req_ids.issubset(submitted_ids) if tut_req_ids else False
        
        # Rule 3: SCE Components
        applicable_sce_statuses = []
        if subject.has_pbl: applicable_sce_statuses.append(record.pbl_status)
        if subject.has_sce_presentation: applicable_sce_statuses.append(record.presentation_status)
        if subject.has_sce_certificate: applicable_sce_statuses.append(record.certification_status)
        sce_ok = all(s == models.SCEStatus.completed for s in applicable_sce_statuses) if applicable_sce_statuses else True
        print(sce_ok,record)
        # Rule 4: Defaulter Assignment (only relevant if attendance is low)
        attendance_ok = record.attendance_percentage >= 70
        defaulter_completed = defaulter_assign_id in submitted_ids if defaulter_assign_id else False

        # Rule 5: Home Assignment
        ha_ok = ha_req_ids.issubset(submitted_ids) if ha_req_ids else False

        # Rule 6: CIE
        cie_ok = not subject.has_cie or record.marks_cie is not None
        
        # --- Determine Final NOC Compliance for Each Type ---
        
        # Theory NOC is met if attendance is ok (or saved by defaulter) AND other components are met.
        theory_reqs_met = False
        if attendance_ok:
            theory_reqs_met = all([cie_ok, ha_ok, theory_assign_ok])
        else: # Low attendance, can only be saved by defaulter assignment
            theory_reqs_met = defaulter_completed and all([cie_ok, ha_ok, theory_assign_ok])
            
        # Lab/Tutorial NOC is met if its assignments are done AND SCE is complete.
        lab_tut_reqs_met = sce_ok
        if subject.has_lab: lab_tut_reqs_met = lab_tut_reqs_met and lab_assign_ok
        if subject.has_tw: lab_tut_reqs_met = lab_tut_reqs_met and tut_assign_ok
        
        # --- Update the database records if the calculated status has changed ---
        if record.theory_noc_status not in [models.NocStatus.GRANTED, models.NocStatus.REFUSED]:
            new_theory_status = models.NocStatus.COMPLETED if theory_reqs_met else models.NocStatus.PENDING
            if record.theory_noc_status != new_theory_status:
                record.theory_noc_status = new_theory_status
                records_updated += 1
        
        if record.lab_tut_noc_status not in [models.NocStatus.GRANTED, models.NocStatus.REFUSED]:
            new_lab_tut_status = models.NocStatus.COMPLETED if lab_tut_reqs_met else models.NocStatus.PENDING
            if record.lab_tut_noc_status != new_lab_tut_status:
                record.lab_tut_noc_status = new_lab_tut_status
                records_updated += 1

    # Commit all changes to the database at once
    if records_updated > 0:
        db.commit()
    
    return records_updated


# Add this function to your app/crud.py file
# Make sure 're' and 'typing.List' are imported at the top



# In app/crud.py
# In app/crud.py
import re
import math
from typing import List

def calculate_student_batch(
    student: models.Student, 
    all_batches_in_division: List[models.Batch],
    all_students_in_division_sorted: List[models.Student]
) -> models.Batch | None:
    """
    Calculates a single student's batch based on their rank in a sorted list.
    """
    if not student.roll_number or not all_batches_in_division:
        return None

    try:
        # CORRECTED: Get the total count from the length of the provided list
        total_students_in_division = len(all_students_in_division_sorted)
        if total_students_in_division == 0:
            return None

        num_batches = len(all_batches_in_division)
        
        # Calculate the size of each batch
        batch_size = math.ceil(total_students_in_division / num_batches)
        
        # Find the student's rank (index) in the sorted list
        student_rank = next((i for i, s in enumerate(all_students_in_division_sorted) if s.id == student.id), -1)
        if student_rank == -1:
            return None # Student not found

        # Calculate batch index using the rank and batch size
        batch_index = student_rank // batch_size
        
        if 0 <= batch_index < num_batches:
            return all_batches_in_division[batch_index]
        else:
            return None
            
    except Exception:
        return None



# In app/crud.py

def update_student_attendance(
    db: Session, student_id: int, subject_id: int, percentage: float
) -> models.StudentSubjectStatus | None:
    """Updates the attendance for a single student in a specific subject."""
    record = db.query(models.StudentSubjectStatus).filter(
        models.StudentSubjectStatus.student_id == student_id,
        models.StudentSubjectStatus.subject_id == subject_id
    ).first()

    if not record:
        return None
    
    record.attendance_percentage = percentage
    db.commit()
    db.refresh(record)
    return record

def batch_update_attendance_for_division(
    db: Session, division_id: int, subject_id: int, percentage: float
) -> int:
    """
    Performs a bulk update of attendance for all students in a given division
    for a specific subject.
    """
    # 1. Find all student IDs in the target division
    student_ids_in_division = db.query(models.Student.id).filter(
        models.Student.division_id == division_id
    ).scalar_subquery()

    # 2. Perform a bulk update on the status table for those students
    #    This is much more efficient than looping through each student.
    update_statement = (
        models.StudentSubjectStatus.__table__.update()
        .where(
            models.StudentSubjectStatus.student_id.in_(student_ids_in_division),
            models.StudentSubjectStatus.subject_id == subject_id
        )
        .values(attendance_percentage=percentage)
    )
    
    result = db.execute(update_statement)
    db.commit()
    
    # result.rowcount returns the number of rows that were updated
    return result.rowcount



# In app/crud.py

def update_student_cie(
    db: Session, student_id: int, subject_id: int, marks: int
) -> models.StudentSubjectStatus | None:
    """Updates the CIE marks for a single student in a specific subject."""
    record = db.query(models.StudentSubjectStatus).filter(
        models.StudentSubjectStatus.student_id == student_id,
        models.StudentSubjectStatus.subject_id == subject_id
    ).first()

    if not record:
        return None
    
    record.marks_cie = marks
    db.commit()
    db.refresh(record)
    return record

def batch_update_cie_for_division(
    db: Session, division_id: int, subject_id: int, marks: int
) -> int:
    """Performs a bulk update of CIE marks for all students in a division."""
    student_ids_in_division = db.query(models.Student.id).filter(
        models.Student.division_id == division_id
    ).scalar_subquery()

    update_statement = (
        models.StudentSubjectStatus.__table__.update()
        .where(
            models.StudentSubjectStatus.student_id.in_(student_ids_in_division),
            models.StudentSubjectStatus.subject_id == subject_id
        )
        .values(marks_cie=marks)
    )
    
    result = db.execute(update_statement)
    db.commit()
    
    return result.rowcount


# In app/crud.py
from sqlalchemy.orm import joinedload

def get_detailed_teacher_assignments(db: Session) -> List[dict]:
    """
    Fetches all teacher assignments and populates them with the specific
    students that fall under each authority group.
    """
    # 1. Pre-fetch all necessary data to be efficient
    all_assignments = db.query(models.TeacherSubjectAssignment).options(
        joinedload(models.TeacherSubjectAssignment.teacher).joinedload(models.Teacher.user),
        joinedload(models.TeacherSubjectAssignment.subject),
        joinedload(models.TeacherSubjectAssignment.division),
        joinedload(models.TeacherSubjectAssignment.batch)
    ).all()
    
    all_students = db.query(models.Student).order_by(models.Student.roll_number).all()
    all_batches = db.query(models.Batch).order_by(models.Batch.name).all()

    # 2. Group students and batches by division for fast lookup
    students_by_division = {}
    for student in all_students:
        if student.division_id not in students_by_division:
            students_by_division[student.division_id] = []
        students_by_division[student.division_id].append(student)

    batches_by_division = {}
    for batch in all_batches:
        if batch.division_id not in batches_by_division:
            batches_by_division[batch.division_id] = []
        batches_by_division[batch.division_id].append(batch)

    # 3. Process each assignment to find its students
    response_list = []
    for assign in all_assignments:
        students_in_group = []
        
        # Get the students for the assignment's division
        students_in_division = students_by_division.get(assign.division_id, [])

        if assign.authority_type == models.AssignmentAuthorityType.THEORY:
            # For Theory, the group is all students in the division
            students_in_group = students_in_division
        else:
            # For Lab/Tutorial, find students in the specific batch
            target_batch_id = assign.batch_id
            division_batches = batches_by_division.get(assign.division_id, [])
            
            for student in students_in_division:
                student_batch = calculate_student_batch(student, division_batches, students_in_division)
                if student_batch and student_batch.id == target_batch_id:
                    students_in_group.append(student)
        
        response_list.append({
            "id": assign.id,
            "authority_type": assign.authority_type.value,
            "teacher": assign.teacher,
            "subject": assign.subject,
            "division": assign.division,
            "batch": assign.batch,
            "students": students_in_group
        })
        
    return response_list



# In app/crud.py

def delete_teacher_subject_assignment(db: Session, assignment_id: int) -> models.TeacherSubjectAssignment | None:
    """Deletes a teacher-subject assignment record by its ID."""
    # Find the record to be deleted
    db_assignment = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.id == assignment_id
    ).first()

    if not db_assignment:
        # If the record doesn't exist, return None
        return None
    
    # Delete the record and commit the change
    db.delete(db_assignment)
    db.commit()
    
    # Return the deleted object as a success signal
    return db_assignment



def batch_update_lab_attendance_for_division(
    db: Session, division_id: int, subject_id: int, percentage: float
) -> int:
    """Performs a bulk update of Lab attendance for all students in a division."""
    student_ids = db.query(models.Student.id).filter(models.Student.division_id == division_id).scalar_subquery()
    update_stmt = (
        models.StudentSubjectStatus.__table__.update()
        .where(
            models.StudentSubjectStatus.student_id.in_(student_ids),
            models.StudentSubjectStatus.subject_id == subject_id
        )
        .values(lab_attendance_percentage=percentage)
    )
    result = db.execute(update_stmt)
    db.commit()
    return result.rowcount

def batch_update_tutorial_attendance_for_division(
    db: Session, division_id: int, subject_id: int, percentage: float
) -> int:
    """Performs a bulk update of Tutorial attendance for all students in a division."""
    student_ids = db.query(models.Student.id).filter(models.Student.division_id == division_id).scalar_subquery()
    update_stmt = (
        models.StudentSubjectStatus.__table__.update()
        .where(
            models.StudentSubjectStatus.student_id.in_(student_ids),
            models.StudentSubjectStatus.subject_id == subject_id
        )
        .values(tutorial_attendance_percentage=percentage)
    )
    result = db.execute(update_stmt)
    db.commit()
    return result.rowcount


# In app/crud.py

# In app/crud.py
import re
from typing import List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.utils import plagiarism_utils

def get_noc_details_for_student(db: Session, student: models.Student) -> List[dict]:
    """
    Fetches and builds the detailed, multi-row NOC data for a single student
    across all their enrolled subjects.
    """
    if not student.division_id:
        return []

    # 1. Pre-fetch all of the student's status records and their related subjects
    all_sce_records = db.query(models.StudentSubjectStatus).filter(
        models.StudentSubjectStatus.student_id == student.id
    ).options(
        joinedload(models.StudentSubjectStatus.subject)
    ).all()

    if not all_sce_records:
        return []

    # 2. Pre-fetch all assignments and submissions for this student's subjects
    subject_ids = [rec.subject_id for rec in all_sce_records]
    all_assignments = db.query(models.Assignment).filter(
        models.Assignment.subject_id.in_(subject_ids)
    ).all()
    
    all_submissions = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id == student.id
    ).all()
    submitted_ids = {s.assignment_id for s in all_submissions if s.status in ['submitted', 'late']}

    response_list = []
    # 3. Process the record for each subject the student is enrolled in
    for record in all_sce_records:
        subject = record.subject
        
        # --- Filter assignments for the current subject ---
        assignments_for_this_subject = [a for a in all_assignments if a.subject_id == subject.id]

        # --- Calculate Completion Statuses for this subject ---
        theory_req_ids = {a.id for a in assignments_for_this_subject if a.assignment_type == "Theory Assignment"}
        all_theory_submitted = theory_req_ids.issubset(submitted_ids)
        
        ha_req_ids = {a.id for a in assignments_for_this_subject if a.assignment_type == "Home Assignment"}
        all_ha_submitted = ha_req_ids.issubset(submitted_ids)

        lab_req_ids = {a.id for a in assignments_for_this_subject if a.assignment_type == "Lab Assignment"}
        all_lab_submitted = lab_req_ids.issubset(submitted_ids)

        tut_req_ids = {a.id for a in assignments_for_this_subject if a.assignment_type == "Tutorial Assignment"}
        all_tut_submitted = tut_req_ids.issubset(submitted_ids)
        
        defaulter_assignment_id = next((a.id for a in assignments_for_this_subject if a.assignment_type == "Defaulter Assignment"), None)
        defaulter_assignment_completed = defaulter_assignment_id in submitted_ids if defaulter_assignment_id else False

        sce_components = [subject.has_pbl, subject.has_sce_presentation, subject.has_sce_certificate]
        sce_statuses = [record.pbl_status, record.presentation_status, record.certification_status]
        is_sce_complete = all(status == models.SCEStatus.completed for status, needed in zip(sce_statuses, sce_components) if needed)
        
        # --- Construct and Append Rows ---
        theory_row = {
            "status_record_id": record.id, "student": student, "noc_type": "Theory",
            "subject": subject.name,
            "attendance": {"status": f"{record.attendance_percentage or 0.0}%", "is_applicable": True},
            "cie": {"status": "Completed" if record.marks_cie is not None else "Pending", "is_applicable": subject.has_cie},
            "home_assignment": {"status": "Completed" if all_ha_submitted else "Pending", "is_applicable": subject.has_ha},
            "assignments": {"status": "Completed" if all_theory_submitted else "Pending", "is_applicable": bool(theory_req_ids)},
            "defaulter_assignment": {"status": "Completed" if defaulter_assignment_completed else "Pending", "is_applicable": record.attendance_percentage < 70 and bool(defaulter_assignment_id)},
            "sce_status": {"status": "N/A", "is_applicable": False},
            "noc_status": record.theory_noc_status.value,
            "is_updatable": False
        }
        response_list.append(theory_row)

        if subject.has_lab:
            lab_row = {
                "status_record_id": record.id, "student": student, "noc_type": "Lab",
                "subject": subject.name,
                "attendance": {"status": f"{record.lab_attendance_percentage or 0.0}%", "is_applicable": True},
                "cie": {"status": "N/A", "is_applicable": False},
                "home_assignment": {"status": "N/A", "is_applicable": False},
                "assignments": {"status": "Completed" if all_lab_submitted else "Pending", "is_applicable": bool(lab_req_ids)},
                "defaulter_assignment": {"status": "N/A", "is_applicable": False},
                "sce_status": {"status": "Completed" if is_sce_complete else "Incomplete", "is_applicable": any(sce_components)},
                "noc_status": record.lab_tut_noc_status.value,
                "is_updatable": False
            }
            response_list.append(lab_row)
        
        if subject.has_tw:
            tutorial_row = {
                "status_record_id": record.id, "student": student, "noc_type": "Tutorial",
                "subject": subject.name,
                "attendance": {"status": f"{record.tutorial_attendance_percentage or 0.0}%", "is_applicable": True},
                "cie": {"status": "N/A", "is_applicable": False},
                "home_assignment": {"status": "N/A", "is_applicable": False},
                "assignments": {"status": "Completed" if all_tut_submitted else "Pending", "is_applicable": bool(tut_req_ids)},
                "defaulter_assignment": {"status": "N/A", "is_applicable": False},
                "sce_status": {"status": "Completed" if is_sce_complete else "Incomplete", "is_applicable": any(sce_components)},
                "noc_status": record.lab_tut_noc_status.value,
                "is_updatable": False
            }
            response_list.append(tutorial_row)
            
    return response_list    


# Add these two new functions to app/crud.py

def update_student_lab_attendance(
    db: Session, student_id: int, subject_id: int, percentage: float
) -> models.StudentSubjectStatus | None:
    """Updates the lab attendance for a single student in a specific subject."""
    record = db.query(models.StudentSubjectStatus).filter(
        models.StudentSubjectStatus.student_id == student_id,
        models.StudentSubjectStatus.subject_id == subject_id
    ).first()

    if not record:
        return None
    
    record.lab_attendance_percentage = percentage
    db.commit()
    db.refresh(record)
    return record

def batch_update_lab_attendance_for_batch(
    db: Session, batch_id: int, subject_id: int, percentage: float
) -> int:
    """
    Performs a bulk update of lab attendance for all students belonging to a
    specific batch in a given subject.
    """
    # 1. Find the division this batch belongs to
    batch = db.query(models.Batch).get(batch_id)
    if not batch:
        return 0 # Batch not found

    # 2. Get all data needed for batch calculation
    all_batches_in_division = db.query(models.Batch).filter(
        models.Batch.division_id == batch.division_id
    ).order_by(models.Batch.name).all()
    
    all_students_in_division_sorted = db.query(models.Student).filter(
        models.Student.division_id == batch.division_id
    ).order_by(models.Student.roll_number).all()

    # 3. Identify all students who belong to the target batch
    target_student_ids = []
    for student in all_students_in_division_sorted:
        student_batch = calculate_student_batch(
            student, all_batches_in_division, all_students_in_division_sorted
        )
        if student_batch and student_batch.id == batch_id:
            target_student_ids.append(student.id)

    if not target_student_ids:
        return 0 # No students found in this batch

    # 4. Perform an efficient bulk update on the status table for those students
    update_statement = (
        models.StudentSubjectStatus.__table__.update()
        .where(
            models.StudentSubjectStatus.student_id.in_(target_student_ids),
            models.StudentSubjectStatus.subject_id == subject_id
        )
        .values(lab_attendance_percentage=percentage)
    )
    
    result = db.execute(update_statement)
    db.commit()
    
    return result.rowcount


# In app/crud.py

def delete_student_account(db: Session, student_id: int) -> dict | None:
    """
    Completely deletes a student's account, profile, and all associated data 
    (submissions, files, attendance, sce records, etc.).
    """
    # 1. Fetch the Student profile
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return None
    
    # Store user_id to delete the central account later
    user_id = student.user_id
    
    # 2. File Cleanup: Delete physical files for all assignments submitted by this student
    submissions = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id == student_id
    ).all()
    
    for sub in submissions:
        if sub.file_path and os.path.exists(sub.file_path):
            try:
                os.remove(sub.file_path)
            except OSError:
                # In a real app, log this error
                pass 
    
    # 3. Delete dependent child records manually 
    # (Necessary because standard foreign keys might not have ON DELETE CASCADE set up in the DB)
    
    # Delete Submissions
    db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.student_id == student_id
    ).delete()
    
    # Delete SCE/NOC Status Records
    db.query(models.StudentSubjectStatus).filter(
        models.StudentSubjectStatus.student_id == student_id
    ).delete()
    
    # Delete Attendance Records
    db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id
    ).delete()
    
    # Delete Grievances
    db.query(models.Grievance).filter(
        models.Grievance.student_id == student_id
    ).delete()
    
    # Delete Notifications
    db.query(models.Notification).filter(
        models.Notification.student_id == student_id
    ).delete()
    
    # 4. Delete the Central User Account
    # Because User has `cascade="all, delete-orphan"` on `student_profile`, 
    # deleting the User will automatically delete the Student profile row.
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
    
    db.commit()
    return {"message": f"Student {student.name} (ID: {student_id}) and all associated records deleted successfully."}