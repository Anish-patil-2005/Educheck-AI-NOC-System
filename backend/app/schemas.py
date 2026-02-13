from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from datetime import datetime
from typing import Any, Optional, List

# --- ENUMS (Consistent with models.py) ---

class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

class YearLevel(str, Enum):
    FY = "First Year"
    SY = "Second Year"
    TY = "Third Year"
    BTECH = "Fourth Year"

class AssignmentAuthorityType(str, Enum):
    THEORY = "Theory"
    TUTORIAL = "Tutorial"
    LAB = "Lab"

class SCEStatus(str, Enum):
    completed = "completed"
    pending = "pending"
    late = "late"


# --- 1. Core Academic Structure Schemas ---

class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class DivisionBase(BaseModel):
    name: str
    department_id: int
    year: YearLevel
    academic_year: int

class DivisionCreate(DivisionBase):
    num_batches: int = Field(1, ge=0)

class DivisionOut(DivisionBase):
    id: int
    department: DepartmentOut
    class Config:
        from_attributes = True

class BatchBase(BaseModel):
    name: str
    division_id: int

class BatchCreate(BatchBase):
    pass

class BatchOut(BatchBase):
    id: int
    class Config:
        from_attributes = True



# --- 2. Refactored User, Student, and Teacher Schemas ---

# Core User Account (for authentication)
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole

class UserOut(UserBase):
    id: int
    role: UserRole
    class Config:
        from_attributes = True

# Student Profile
class StudentProfileBase(BaseModel):
    name: str
    roll_number: Optional[str] = None
    year: Optional[YearLevel] = None
    division_id: Optional[int] = None

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentOut(StudentProfileBase):
    id: int
    user: UserOut
    division: Optional[DivisionOut] = None
    class Config:
        from_attributes = True
        
# Teacher Profile
class TeacherProfileBase(BaseModel):
    name: str

class TeacherProfileCreate(TeacherProfileBase):
    pass

class TeacherOut(TeacherProfileBase):
    id: int
    user: UserOut
    class Config:
        from_attributes = True

# Combined Schemas for Signup and Login
class StudentSignup(StudentProfileCreate):
    user: UserCreate

class TeacherSignup(TeacherProfileCreate):
    user: UserCreate

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class StudentBatchSignup(BaseModel):
    students: List[StudentSignup]

# Add this schema for the response
class BatchSignupResponse(BaseModel):
    successful_creates: int
    failed_emails: List[str]

# --- 3. UPDATED Subject Schemas ---

class SubjectBase(BaseModel):
    name: str

class SubjectFilterData(BaseModel):
    id: int
    name: str
    year: str # e.g., "First Year"

class SubjectCreate(SubjectBase):
    department_id: int
    year: YearLevel
    has_cie: bool = False
    has_ha: bool = False
    has_tw: bool = False
    has_pbl: bool = False
    has_lab: bool = False
    has_sce_presentation: bool = False
    has_sce_certificate: bool = False
    attendance_threshold: int = Field(75, ge=0, le=100)

class SubjectParamsUpdate(BaseModel):
    has_cie: Optional[bool] = None
    has_ha: Optional[bool] = None
    has_tw: Optional[bool] = None
    has_pbl: Optional[bool] = None
    has_lab: Optional[bool] = None
    has_sce_presentation: Optional[bool] = None
    has_sce_certificate: Optional[bool] = None
    attendance_threshold: Optional[int] = Field(None, ge=0, le=100)

class SubjectOut(SubjectBase):
    id: int
    department: DepartmentOut
    year: YearLevel
    has_cie: bool; has_ha: bool; has_tw: bool; has_pbl: bool; has_lab: bool
    has_sce_presentation: bool; has_sce_certificate: bool
    attendance_threshold: int
    class Config:
        from_attributes = True


# --- 4. Teacher Assignment Schemas ---

class TeacherSubjectAssignmentCreate(BaseModel):
    teacher_id: int
    subject_id: int
    division_id: int
    batch_id: Optional[int] = None
    authority_type: AssignmentAuthorityType

class TeacherSubjectAssignmentOut(BaseModel):
    id: int
    teacher: TeacherOut
    subject: SubjectOut
    division: DivisionOut
    batch: Optional[BatchOut] = None
    authority_type: AssignmentAuthorityType
    class Config:
        from_attributes = True
class TeacherAuthority(BaseModel):
    subject_id: int
    division_id: int
    authority_type: str

class NocDivisionFilterData(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class NocSubjectFilterData(BaseModel):
    id: int
    name: str
    year: str
    has_cie: bool
    has_ha: bool
    has_lab: bool
    has_tw: bool

    class Config:
        from_attributes = True

class NocFilterOptionsOut(BaseModel):
    subjects: List[NocSubjectFilterData]
    divisions: List[NocDivisionFilterData]
class FilterOptionsOut(BaseModel):
    subjects: List[SubjectFilterData]   # Assuming these are dicts like {"id": 1, "name": "AI"}
    classes: List[dict]   # Assuming these are dicts
    divisions: List[dict]
    batches: List[dict]
    assignmentTypes: List[str]
    years: List[str]      # <-- ADD THIS LINE
    authorities: List[TeacherAuthority] # <-- ADD THIS LINE
# --- 5. UPDATED Assignment and Submission Schemas ---

class AssignmentCreate(BaseModel):
    title: str
    subject_id: int
    division_id: int
    batch_id: Optional[int] = None
    description: Optional[str] = None
    deadline: datetime
    assignment_file_path: Optional[str] = None
    solution_file_path: Optional[str] = None
    assignment_type: str
    max_marks: int
    is_sample: bool = False
    status: str = 'draft'

# In app/schemas.py

class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    deadline: datetime
    assignment_type: str
    max_marks: int
    created_at: datetime
    
    # ADDED: These fields were missing
    is_sample: bool
    status: str
    instructions: Optional[str]
    assignment_file_path: Optional[str]
    solution_file_path: Optional[str]

    # These nested objects were already correct
    subject: SubjectOut
    teacher: TeacherOut
    division: DivisionOut
    batch: Optional[BatchOut] = None
    
    class Config:
        from_attributes = True

class AssignmentSubmissionCreate(BaseModel):
    assignment_id: int
    content: Optional[str] = None
    file_path: Optional[str] = None

class AssignmentSubmissionOut(BaseModel):
    id: int
    assignment_id: int
    content: Optional[str] = None
    file_path: Optional[str]
    marks: Optional[float]
    status: str
    submitted_at: Optional[datetime] = None
    bert_score: Optional[float]
    student: StudentOut
    class Config:
        from_attributes = True

# --- 6. UPDATED Detailed "View" Schemas for UI ---

class StudentSubmissionDetail(BaseModel):
    id: int
    student: StudentOut
    submitted_at: Optional[datetime] = None
    status: str
   
    marks: Optional[float]
    feedback: Optional[str] = None
    file_path: Optional[str]
    class Config:
        from_attributes = True

# In app/schemas.py

# A lightweight response model for the grade update endpoint
class SubmissionUpdateOut(BaseModel):
    id: int
    marks: Optional[float]
    feedback: Optional[str] = None
    bert_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class SubmissionGradeUpdate(BaseModel):
    marks: float = Field(..., ge=0)
    feedback: Optional[str] = None

class TeacherAssignmentDetail(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: SubjectOut
    division: DivisionOut
    batch: Optional[BatchOut] = None
    deadline: datetime
    created_at: datetime
    max_marks: int
    instructions: Optional[str]
    status: str
    teacher: TeacherOut
    assignment_type: str
    submissions: List[StudentSubmissionDetail] = []
    assignment_file_path: Optional[str]
    solution_file_path: Optional[str]
    class Config:
        from_attributes = True


# --- 7. UPDATED Other Supporting Schemas ---

# In app/schemas.py

class MessageResponse(BaseModel):
    message: str


class GrievanceCreate(BaseModel):
    subject_id: Optional[int] = None
    title: str
    description: str

class GrievanceOut(BaseModel):
    id: int
    subject: Optional[SubjectOut] = None
    title: str
    description: str
    status: str
    response: Optional[str] = None
    student: StudentOut
    class Config:
        from_attributes = True
from pydantic import BaseModel, field_validator
class NocStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    GRANTED = "Granted"
    REFUSED = "Refused"

class MessageCreate(BaseModel):
    receiver_id: int # user.id
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    subject_id: int
    message: str

class NotificationOut(BaseModel):
    id: int
    message: str
    created_at: datetime
    student: StudentOut
    subject: SubjectOut
    class Config:
        from_attributes = True


# --- 8. UPDATED NOC, Marks, and SCE Schemas ---

class NocStatusResponse(BaseModel):
    student: StudentOut
    subject: SubjectOut
    eligible: bool
    reason: Optional[str] = None
    class Config:
        from_attributes = True

class MarksUpdateRequest(BaseModel):
    student_id: int
    subject_id: int
    marks_cie: Optional[int] = Field(None, ge=0, le=100)
    marks_ha: Optional[int] = Field(None, ge=0, le=100)
    marks_tw: Optional[int] = Field(None, ge=0, le=100)
    attendance_percentage: Optional[float] = Field(None, ge=0, le=100)
    pbl_status: Optional[SCEStatus] = None
    presentation_status: Optional[SCEStatus] = None
    certification_status: Optional[SCEStatus] = None
    pbl_score: Optional[int] = Field(None, ge=0, le=100)
    pbl_title: Optional[str] = None
    presentation_score: Optional[int] = Field(None, ge=0, le=100)
    presentation_topic: Optional[str] = None
    certification_name: Optional[str] = None
    certification_provider: Optional[str] = None

class SCEDetailOut(BaseModel):
    id: int
    student: StudentOut
    subject: SubjectOut
    pbl_status: SCEStatus
    pbl_score: Optional[int]
    pbl_title: Optional[str]
    presentation_status: SCEStatus
    presentation_score: Optional[int]
    presentation_topic: Optional[str]
    certification_status: SCEStatus
    certification_name: Optional[str]
    certification_provider: Optional[str]
    last_updated: datetime
    class Config:
        from_attributes = True


# response 

class ErrorResponse(BaseModel):
    """A standardized schema for API error responses."""
    status_code: int
    detail: str
    error_code: Optional[str] = None # Optional machine-readable error code




    # In app/schemas.py

# A schema to represent the current student's submission for an assignment
class MySubmissionStatusOut(BaseModel):
    status: str
    submitted_at: Optional[datetime] = None
    marks: Optional[float] = None
    bert_score: Optional[float] = None
    class Config:
        from_attributes = True

from pydantic import BaseModel, computed_field

# The new, cleaner response schema for the student assignment list
# A new schema for the student's submission status
class MySubmissionStatusOut(BaseModel):
    status: str
    submitted_at: Optional[datetime] = None
    marks: Optional[float] = None

    class Config:
        from_attributes = True

# The new, leaner response schema for the student assignment list
class StudentAssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    deadline: datetime
    assignment_type: str
    max_marks: int
    assignment_file_path: Optional[str]
    subject_name: str
    teacher_name: str
    my_submission: Optional[MySubmissionStatusOut] = None

    # This schema is manually built, so from_attributes is not strictly needed
    # but it's good practice to keep it.
    class Config:
        from_attributes = True



class BertRejectionResponse(BaseModel):
    detail: str
    ideal_solution_summary: str



# Schema for the backfill request body
class StudentIDList(BaseModel):
    student_ids: List[int]

# Schema for the backfill response
class BackfillResponse(BaseModel):
    message: str
    records_created: int
    students_processed: int
    students_skipped: int # (e.g., no division)




# In app/schemas.py

class SceDetailsResponse(BaseModel):
    can_update: List[SCEDetailOut]
    can_view_only: List[SCEDetailOut]


# In app/schemas.py
class NocFinalStatus(str, Enum):
    PENDING_VERIFICATION = "Pending Verification"
    GRANTED = "Granted"
    REFUSED = "Refused"
class NocComponentStatus(BaseModel):
    status: str  # e.g., "Completed", "Pending", "75%"
    is_applicable: bool

# In app/schemas.py

class NocDetailRow(BaseModel):
    # Core identifiers
    status_record_id: int 
    student: StudentOut
    noc_type: str
    
    # All possible NOC components
    attendance: NocComponentStatus
    cie: NocComponentStatus
    home_assignment: NocComponentStatus
    assignments: NocComponentStatus
    defaulter_assignment: NocComponentStatus
    sce_status: NocComponentStatus
    
    # The single, unified status field for the row
    noc_status: NocStatus
    
    # Flag to tell the frontend if action buttons should be enabled
    is_updatable: bool

    class Config:
        from_attributes = True

class StudentNocDetailRow(BaseModel):
    # Core identifiers
    status_record_id: int 
    student: StudentOut
    noc_type: str
    subject:str
    # All possible NOC components
    attendance: NocComponentStatus
    cie: NocComponentStatus
    home_assignment: NocComponentStatus
    assignments: NocComponentStatus
    defaulter_assignment: NocComponentStatus
    sce_status: NocComponentStatus
    
    # The single, unified status field for the row
    noc_status: NocStatus
    
    # Flag to tell the frontend if action buttons should be enabled
    is_updatable: bool

    class Config:
        from_attributes = True


class NocStatusUpdate(BaseModel):
    # This schema now sends the final status enum
    noc_status: NocStatus
    reason: Optional[str] = None
    @field_validator('noc_status')
    @classmethod
    def status_must_be_final(cls, v: NocStatus) -> NocStatus:
        if v not in [NocStatus.GRANTED, NocStatus.REFUSED]:
            raise ValueError('This action can only Grant or Refuse a NOC.')
        return v


# In app/schemas.py

class StudentSubjectStatusOut(BaseModel):
    id: int
    attendance_percentage: float
    marks_cie: Optional[int] = None
    marks_ha: Optional[int] = None
    marks_tw: Optional[int] = None
    pbl_status: SCEStatus
    presentation_status: SCEStatus
    certification_status: SCEStatus
    certification_status: SCEStatus
    pbl_score: Optional[int] = None
    pbl_title: Optional[str] = None
    presentation_score: Optional[int] = None
    presentation_topic: Optional[str] = None
    certification_name: Optional[str] = None
    certification_provider: Optional[str] = None
    
    noc_reason: Optional[str] = None
    last_updated: datetime

 # --- CORRECTED FIELDS ---
    theory_noc_status: NocStatus
    lab_tut_noc_status: NocStatus
      # Use the new reason field
    # ---

    # Include the full student and subject details in the response
    student: StudentOut
    subject: SubjectOut

    class Config:
        from_attributes = True


# In app/schemas.py

class BatchWithStudentsOut(BaseModel):
    batch_id: int
    batch_name: str
    students: List[StudentOut]

class DivisionBatchAllocation(BaseModel):
    division_id: int
    division_name: str
    total_students: int
    batch_allocations: List[BatchWithStudentsOut]


# In app/schemas.py

class StudentAttendanceUpdate(BaseModel):
    subject_id: int
    attendance_percentage: float = Field(..., ge=0, le=100)

class DivisionAttendanceUpdate(BaseModel):
    subject_id: int
    attendance_percentage: float = Field(..., ge=0, le=100)

class BatchUpdateResponse(BaseModel):
    message: str
    records_updated: int



# In app/schemas.py
from pydantic import Field

class StudentCieUpdate(BaseModel):
    subject_id: int
    marks_cie: int = Field(..., ge=0, description="CIE marks for the student.")

class DivisionCieUpdate(BaseModel):
    subject_id: int
    marks_cie: int = Field(..., ge=0, description="CIE marks to be applied to all students.")

# In app/schemas.py

class DetailedTeacherAssignmentOut(BaseModel):
    id: int
    authority_type: str
    teacher: TeacherOut
    subject: SubjectOut
    division: DivisionOut
    batch: Optional[BatchOut] = None
    students: List[StudentOut]

    class Config:
        from_attributes = True



class DivisionLabAttendanceUpdate(BaseModel):
    subject_id: int
    lab_attendance_percentage: float = Field(..., ge=0, le=100)

class DivisionTutorialAttendanceUpdate(BaseModel):
    subject_id: int
    tutorial_attendance_percentage: float = Field(..., ge=0, le=100)


# In app/schemas.py

class StudentLabAttendanceUpdate(BaseModel):
    subject_id: int
    lab_attendance_percentage: float = Field(..., ge=0, le=100)

class BatchLabAttendanceUpdate(BaseModel):
    subject_id: int
    lab_attendance_percentage: float = Field(..., ge=0, le=100)