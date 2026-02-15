from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
import logging
from app import schemas
from app.models import Base
from app.db import engine
from app.routers import (
    auth,
    noc,
    sce,
    subject,
    assignment,
    grievance,
    message,
    admin,
    marks,
    teachers
)
from app.routers.status import router as noc_status_router

# Create database tables

# Initialize FastAPI app
app = FastAPI()
# Base.metadata.create_all(bind=engine)


# --- CORS Configuration ---
# Define the origins (domains) that are allowed to make requests to this backend.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
     "http://localhost:5173",  # <-- ADD THIS LINE
     "http://localhost:5174",  # <-- ADD THIS LINE
     "http://localhost:5175",  # <-- ADD THIS LINE
     "http://localhost:5176",  # <-- ADD THIS LINE
     "http://localhost:5177",  # <-- ADD THIS LINE
    "http://127.0.0.1:5173",
    "https://educheck-ai-assignment-noc-system.vercel.app",
    
    
]

# Add the CORSMiddleware to your app instance.
# This must be done here, after app is created and before any routers are included.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception Handlers ---

logger = logging.getLogger(__name__)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP error {exc.status_code} for {request.url}: {exc.detail}")
    
    if isinstance(exc.detail, dict):
        content = exc.detail
    else:
        error_content = schemas.ErrorResponse(
            status_code=exc.status_code,
            detail=exc.detail
        )
        content = error_content.model_dump()

    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error for {request.url}: {exc}", exc_info=True)
    
    error_content = schemas.ErrorResponse(
        status_code=500,
        detail="An internal server error occurred.",
        error_code="INTERNAL_SERVER_ERROR"
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_content.model_dump()
    )



# --- Router Inclusion ---
app.include_router(auth.router)
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(subject.router)
app.include_router(assignment.router)
app.include_router(noc_status_router)
app.include_router(marks.router)
app.include_router(noc.router)
app.include_router(sce.router)
app.include_router(grievance.router)
app.include_router(message.router)
app.include_router(teachers.router)

# --- Root Endpoint ---
@app.get("/")
def home():
    return {"message": "Backend is running!"}