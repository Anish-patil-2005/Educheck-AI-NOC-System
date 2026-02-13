from sqlalchemy import (
    Column, Integer, String, Enum as SQLAlchemyEnum, ForeignKey,
    Float, DateTime, Boolean, Text
)
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime

Base = declarative_base()

# --- ENUMS for consistent data types ---

class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"



class NocStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    GRANTED = "Granted"
    REFUSED = "Refused"


class YearLevel(str, enum.Enum):
    FY = "First Year"
    SY = "Second Year"
    TY = "Third Year"
    BTECH = "Fourth Year"

class AssignmentAuthorityType(str, enum.Enum):
    THEORY = "Theory"
    TUTORIAL = "Tutorial"
    LAB = "Lab"

class SCEStatus(str, enum.Enum):
    completed = "completed"
    pending = "pending"
    late = "late"


# --- NEW: Central Authentication and Profile Models ---

class User(Base):
    """The central account model for authentication."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False)

    # One-to-one relationships to role-specific profiles
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Student(Base):
    """Profile model for students with student-specific details."""
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    name = Column(String, nullable=False)
    roll_number = Column(String, nullable=True)
    year = Column(SQLAlchemyEnum(YearLevel), nullable=True)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=True)

    user = relationship("User", back_populates="student_profile")
    division = relationship("Division", back_populates="students")

    # Relationships to data created by this student
    submissions = relationship("AssignmentSubmission", back_populates="student")
    grievances = relationship("Grievance", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")
    notifications = relationship("Notification", back_populates="student")
    status_records = relationship("StudentSubjectStatus", back_populates="student")

class Teacher(Base):
    """Profile model for teachers with teacher-specific details."""
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    name = Column(String, nullable=False)
    
    user = relationship("User", back_populates="teacher_profile")

    # Relationships to data created by this teacher
    subject_assignments = relationship("TeacherSubjectAssignment", back_populates="teacher")
    assignments_created = relationship("Assignment", back_populates="teacher")


# --- Core Academic Structure Models ---

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    divisions = relationship("Division", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

class Division(Base):
    __tablename__ = "divisions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    year = Column(SQLAlchemyEnum(YearLevel), nullable=False)
    academic_year = Column(Integer, nullable=False)

    department = relationship("Department", back_populates="divisions")
    batches = relationship("Batch", back_populates="division")
    students = relationship("Student", back_populates="division")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    
    division = relationship("Division", back_populates="batches")


# --- Core Subject and Assignment Models ---

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    year = Column(SQLAlchemyEnum(YearLevel), nullable=False)
    
    has_cie = Column(Boolean, default=False)
    has_ha = Column(Boolean, default=False)
    has_tw = Column(Boolean, default=False)
    has_pbl = Column(Boolean, default=False)
    has_lab = Column(Boolean, default=False)
    has_sce_presentation = Column(Boolean, default=False)
    has_sce_certificate = Column(Boolean, default=False)
    has_sce_pbl = Column(Boolean, default=False)
    attendance_threshold = Column(Integer, default=75)

    department = relationship("Department", back_populates="subjects")
    assignments = relationship("Assignment", back_populates="subject")
    teacher_assignments = relationship("TeacherSubjectAssignment", back_populates="subject")

class TeacherSubjectAssignment(Base):
    __tablename__ = "teacher_subject_assignments"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    authority_type = Column(SQLAlchemyEnum(AssignmentAuthorityType), nullable=False)

    teacher = relationship("Teacher", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="teacher_assignments")
    division = relationship("Division")
    batch = relationship("Batch")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    assignment_file_path = Column(String, nullable=True)
    solution_file_path = Column(String, nullable=True)
    assignment_type = Column(String, nullable=False)
    max_marks = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_sample = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="pending")
    instructions = Column(Text, nullable=True)
    
    subject = relationship("Subject", back_populates="assignments")
    teacher = relationship("Teacher", back_populates="assignments_created")
    division = relationship("Division")
    batch = relationship("Batch")
    submissions = relationship(
    "AssignmentSubmission", 
    back_populates="assignment", 
    cascade="all, delete-orphan"
)

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    content = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    marks = Column(Float, nullable=True)
    status = Column(String, default="pending")
    submitted_at = Column(DateTime, nullable=True) # Can be NULL
    bert_score = Column(Float, nullable=True)
    #tfidf_vector = Column(Text, nullable=True)
    plagiarism_fingerprint = Column(Text, nullable=True) # <-- ADD THIS
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")

# --- Other Supporting Models ---






class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    attendance_percent = Column(Float, default=0.0)

    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject")

class StudentSubjectStatus(Base):
    __tablename__ = "student_subject_status"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    attendance_percentage = Column(Float, default=0.0)
    marks_cie = Column(Integer, nullable=True)
    marks_ha = Column(Integer, nullable=True)
    marks_tw = Column(Integer, nullable=True)
    pbl_status = Column(SQLAlchemyEnum(SCEStatus), default=SCEStatus.pending)
    presentation_status = Column(SQLAlchemyEnum(SCEStatus), default=SCEStatus.pending)
    certification_status = Column(SQLAlchemyEnum(SCEStatus), default=SCEStatus.pending)
    pbl_score = Column(Integer, nullable=True)
    pbl_title = Column(String, nullable=True)
    presentation_score = Column(Integer, nullable=True)
    presentation_topic = Column(String, nullable=True)
    certification_name = Column(String, nullable=True)
    certification_provider = Column(String, nullable=True)
    
     
    # --- ADD TWO NEW STATUS COLUMNS ---
    theory_noc_status = Column(SQLAlchemyEnum(NocStatus), nullable=False, default=NocStatus.PENDING)
    lab_tut_noc_status = Column(SQLAlchemyEnum(NocStatus), nullable=False, default=NocStatus.PENDING)
    # ------------------------------------
    
    noc_reason = Column(String, default="")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    lab_attendance_percentage = Column(Float, nullable=True)
    tutorial_attendance_percentage = Column(Float, nullable=True)
    student = relationship("Student", back_populates="status_records")
    subject = relationship("Subject")

class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="Pending")
    response = Column(Text, nullable=True)

    student = relationship("Student", back_populates="grievances")
    subject = relationship("Subject")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    # NOTE: Messages link to the central user account for flexibility
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    student = relationship("Student", back_populates="notifications")
    subject = relationship("Subject")
    