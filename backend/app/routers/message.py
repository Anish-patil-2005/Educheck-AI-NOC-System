from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, db
from app.dependencies import get_current_user, require_role
from app.models import UserRole

router = APIRouter()

def get_db():
    db = db.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post(
    "/messages",
    response_model=schemas.MessageOut,
    dependencies=[Depends(require_role(UserRole.student))]  # Or add more roles if needed
)
def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security check: sender_id must be the current user
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot send message as another user.")
    
    db_message = models.Message(**message.model_dump())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.get(
    "/messages/{user1_id}/{user2_id}",
    response_model=list[schemas.MessageOut],
    dependencies=[Depends(require_role(UserRole.student))]  # Adjust roles as needed
)
def get_messages_between_users(
    user1_id: int,
    user2_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security check: current user must be one of the two users
    if current_user.id not in (user1_id, user2_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.timestamp.asc()).all()
    return messages
