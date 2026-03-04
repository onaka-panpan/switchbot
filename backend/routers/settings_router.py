from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.auth import get_current_user
from backend.database import get_connection
from backend.switchbot_api import get_devices

router = APIRouter(prefix="/api/settings", tags=["settings"])


class TokenUpdate(BaseModel):
    switchbot_token: str
    switchbot_secret: str


@router.get("/profile")
async def get_profile(_: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT key, value FROM settings WHERE key IN ('switchbot_token', 'switchbot_secret')"
        ).fetchall()
        kv = {r["key"]: r["value"] for r in rows}
        token = kv.get("switchbot_token", "")
    finally:
        conn.close()

    masked_token = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else "未設定"
    try:
        devices_resp = await get_devices()
        device_count = len(devices_resp.get("body", {}).get("deviceList", []))
    except Exception:
        device_count = None

    return {
        "token_masked": masked_token,
        "token_configured": bool(token),
        "device_count": device_count,
    }


@router.put("/token", status_code=204)
def update_token(body: TokenUpdate, _: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        for key, value in [
            ("switchbot_token", body.switchbot_token),
            ("switchbot_secret", body.switchbot_secret),
        ]:
            conn.execute(
                """INSERT INTO settings (key, value, updated_at)
                   VALUES (?, ?, CURRENT_TIMESTAMP)
                   ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at""",
                (key, value),
            )
        conn.commit()
    finally:
        conn.close()
