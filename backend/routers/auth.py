from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from datetime import datetime, timedelta
import hashlib
import jwt
import os
import secrets
import json
from pathlib import Path

router = APIRouter()
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "barangay-sto-nino-budget-system-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

# ── File-based reset token store ──────────────────────────────────────────────
# Tokens are stored server-side in a JSON file.
# The actual token is delivered to the user via email (not returned in the API response).
RESET_TOKENS_FILE = Path(__file__).parent.parent / "password_reset_tokens.json"
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))


def _load_tokens() -> dict:
    if RESET_TOKENS_FILE.exists():
        try:
            return json.loads(RESET_TOKENS_FILE.read_text())
        except Exception:
            return {}
    return {}


def _save_tokens(data: dict):
    RESET_TOKENS_FILE.write_text(json.dumps(data, indent=2))


def _create_reset_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    tokens = _load_tokens()
    # Invalidate any existing unused tokens for this user
    tokens = {t: v for t, v in tokens.items() if v["user_id"] != user_id}
    tokens[token] = {
        "user_id": user_id,
        "expires_at": (datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)).isoformat(),
        "used": False,
    }
    _save_tokens(tokens)
    return token


def _consume_reset_token(token: str):
    tokens = _load_tokens()
    entry = tokens.get(token)
    if not entry or entry["used"]:
        return None
    if datetime.utcnow() > datetime.fromisoformat(entry["expires_at"]):
        return None
    entry["used"] = True
    _save_tokens(tokens)
    return entry["user_id"]


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    role: str = "official"
    admin_code: str = ""

class ForgotPasswordRequest(BaseModel):
    username: str
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Config ────────────────────────────────────────────────────────────────────

ALLOWED_ROLES = {"admin", "treasurer", "auditor", "official"}
PRIVILEGED_ROLES = {"admin", "treasurer", "auditor"}
ADMIN_REGISTRATION_CODE = os.getenv("ADMIN_REGISTRATION_CODE", "")


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Dependencies ──────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(*roles):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.username == request.username,
            User.hashed_password == _hash(request.password),
            User.is_active == True
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user.last_login = datetime.utcnow()
    await db.commit()

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        },
    )


@router.post("/register", status_code=201)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if request.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {', '.join(ALLOWED_ROLES)}")

    if request.role in PRIVILEGED_ROLES:
        if not ADMIN_REGISTRATION_CODE:
            raise HTTPException(
                status_code=403,
                detail="Privileged role registration is disabled. Contact the system administrator."
            )
        if request.admin_code != ADMIN_REGISTRATION_CODE:
            raise HTTPException(status_code=403, detail="Invalid admin registration code.")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    if (await db.execute(select(User).where(User.username == request.username))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken.")

    if (await db.execute(select(User).where(User.email == request.email.strip().lower()))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        username=request.username.strip(),
        email=request.email.strip().lower(),
        hashed_password=_hash(request.password),
        full_name=request.full_name.strip(),
        role=request.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            User.username == request.username,
            User.email == request.email.strip().lower(),
            User.is_active == True,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No active account found with that username and email combination."
        )

    token = _create_reset_token(user.id)

    # Send email in the background so the response is immediate
    from services.email_service import send_password_reset_email
    background_tasks.add_task(
        send_password_reset_email,
        to_email=user.email,
        full_name=user.full_name,
        reset_token=token,
        expires_minutes=RESET_TOKEN_EXPIRE_MINUTES,
    )

    return {
        "message": f"Password reset link sent to {user.email}. Please check your inbox (and spam folder).",
        "expires_in_minutes": RESET_TOKEN_EXPIRE_MINUTES,
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_id = _consume_reset_token(request.token)
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please request a new one."
        )
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = _hash(request.new_password)
    await db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat(),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
    }


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]