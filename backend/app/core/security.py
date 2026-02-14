from datetime import datetime, timedelta
from typing import Optional

import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app import db

# ==========================================================
# 🔐 SECURITY CONFIG
# ==========================================================

# ⚠️ Move this to environment variable in production
SECRET_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

# ==========================================================
# 🔒 PASSWORD HASHING CONFIG
# ==========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# bcrypt only supports 72 BYTES
MAX_BCRYPT_BYTES = 72


def _truncate_password(password: str) -> bytes:
    """
    Ensures password respects bcrypt 72-byte limit.
    We slice AFTER encoding to avoid multi-byte UTF-8 overflow.
    """
    if not password:
        return b""
    return password.encode("utf-8")[:MAX_BCRYPT_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.
    Handles bcrypt 72-byte limitation safely.
    """
    try:
        safe_password = _truncate_password(plain_password)
        return pwd_context.verify(safe_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hash password safely with bcrypt.
    """
    safe_password = _truncate_password(password)
    return pwd_context.hash(safe_password)


# ==========================================================
# 🗄️ DATABASE SESSION DEPENDENCY
# ==========================================================

def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


# ==========================================================
# 🔑 JWT UTILITIES
# ==========================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode JWT token and return email (sub).
    Returns None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email: str = payload.get("sub")
        if email is None:
            return None

        return email

    except jwt.PyJWTError:
        return None
