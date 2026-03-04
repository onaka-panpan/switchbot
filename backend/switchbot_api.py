import hashlib
import hmac
import time
import uuid
import base64
from typing import Any, Optional

import httpx

from backend.config import settings
from backend.database import get_connection

SWITCHBOT_API_BASE = "https://api.switch-bot.com"


def _get_token_and_secret() -> tuple[str, str]:
    """設定テーブルから token/secret を取得。なければ環境変数から。"""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT key, value FROM settings WHERE key IN ('switchbot_token', 'switchbot_secret')"
        ).fetchall()
        kv = {r["key"]: r["value"] for r in rows}
    finally:
        conn.close()

    token = kv.get("switchbot_token") or settings.switchbot_api_token or ""
    secret = kv.get("switchbot_secret") or settings.switchbot_api_secret or ""
    return token, secret


def _build_headers() -> dict[str, str]:
    token, secret = _get_token_and_secret()
    t = str(int(round(time.time() * 1000)))
    nonce = str(uuid.uuid4())
    string_to_sign = f"{token}{t}{nonce}"
    sign = base64.b64encode(
        hmac.new(
            secret.encode("utf-8"),
            msg=string_to_sign.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
    ).decode("utf-8")
    return {
        "Authorization": token,
        "sign": sign,
        "t": t,
        "nonce": nonce,
        "Content-Type": "application/json",
    }


async def get_devices() -> dict[str, Any]:
    headers = _build_headers()
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{SWITCHBOT_API_BASE}/v1.1/devices", headers=headers)
        resp.raise_for_status()
        return resp.json()


async def send_command(
    device_id: str,
    command: str,
    parameter: Optional[str] = "default",
    command_type: str = "command",
) -> dict[str, Any]:
    headers = _build_headers()
    body = {
        "command": command,
        "parameter": parameter,
        "commandType": command_type,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{SWITCHBOT_API_BASE}/v1.1/devices/{device_id}/commands",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        return resp.json()
