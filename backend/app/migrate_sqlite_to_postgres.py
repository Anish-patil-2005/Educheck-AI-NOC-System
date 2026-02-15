import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

# Import your SQLAlchemy models (ensure these match your app.models)
from app.models import (
    Base, User, Student, Teacher, Department, Division, 
    Batch, Subject, TeacherSubjectAssignment, Assignment, 
    AssignmentSubmission, Attendance, StudentSubjectStatus, 
    Grievance, Message, Notification
)

# --- CONFIGURATION ---
SQLITE_URL = "sqlite:///./test.db"
# If your Render URL starts with postgres://, SQLAlchemy will fail. 
# We fix it here.
RENDER_POSTGRES_URL = "postgresql://educheck_ai_assignment_noc_system_5soy_user:AXVczwBKNGA1huFzqyYBu4xKjHHcPlyT@dpg-d68lip3h46gs73fgrohg-a.oregon-postgres.render.com/educheck_ai_assignment_noc_system_5soy".replace("postgres://", "postgresql://", 1)

# --- ENGINES & SESSIONS ---
sqlite_engine = create_engine(SQLITE_URL)
SQLiteSession = sessionmaker(bind=sqlite_engine)
sqlite_session = SQLiteSession()

postgres_engine = create_engine(RENDER_POSTGRES_URL)
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

def migrate_model(model):
    """
    Migrates a single model from SQLite to Postgres.
    Handles '0' ID FK issues and resets Postgres sequences.
    """
    table_name = model.__tablename__
    print(f"Migrating table: {table_name}...")
    
    try:
        records = sqlite_session.query(model).all()
        if not records:
            print(f"  - No records found in SQLite for {table_name}. Skipping.")
            return

        with postgres_session.no_autoflush:
            for record in records:
                # Get column data excluding internal SQLAlchemy state
                data = {c.key: getattr(record, c.key) for c in inspect(record).mapper.column_attrs}
                
                # --- FIX: FOREIGN KEY 0-CLEANING ---
                # PostgreSQL doesn't allow ID 0 for FKs if 0 doesn't exist in parent.
                # We replace 0 with None (NULL) for common foreign key columns.
                fk_cols = ['batch_id', 'division_id', 'teacher_id', 'subject_id', 'user_id', 'department_id']
                for col in fk_cols:
                    if col in data and data[col] == 0:
                        data[col] = None

                # Create the new Postgres record
                new_obj = model(**data)
                postgres_session.merge(new_obj)

        postgres_session.commit()
        print(f"  - Successfully migrated {len(records)} records.")

        # --- FIX: RESET SERIAL SEQUENCES ---
        # This prevents 'UniqueConstraint' errors when the app tries to create new records.
        if hasattr(model, 'id'):
            postgres_session.execute(text(
                f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM {table_name};"
            ))
            postgres_session.commit()

    except Exception as e:
        postgres_session.rollback()
        print(f"  !!! ERROR in {table_name}: {str(e)}")

def run_migration():
    print("--- Starting Migration: SQLite -> Render Postgres ---")

    # The ORDER of this list is CRITICAL for Foreign Key integrity.
    # Parents must be migrated before Children.
    models_in_order = [
        Department,
        Division,
        Batch,
        User,
        Student,
        Teacher,
        Subject,
        TeacherSubjectAssignment,
        Assignment,
        AssignmentSubmission,
        Attendance,
        StudentSubjectStatus,
        Grievance,
        Message,
        Notification
    ]

    for model in models_in_order:
        migrate_model(model)

    print("--- Migration Finished ---")

if __name__ == "__main__":
    run_migration()