from fastapi import APIRouter, Depends, HTTPException, status

from backend.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import get_connection
from backend.models.user import ChangePasswordRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE username = ?", (body.username,)
        ).fetchone()
    finally:
        conn.close()

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(body.username)
    return TokenResponse(access_token=token)


@router.post("/change-password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    username: str = Depends(get_current_user),
):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE username = ?", (username,)
        ).fetchone()
        if not row or not verify_password(body.current_password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        conn.execute(
            "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
            (hash_password(body.new_password), username),
        )
        conn.commit()
    finally:
        conn.close()
