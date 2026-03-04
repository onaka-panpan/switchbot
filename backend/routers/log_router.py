import json
from typing import List

from fastapi import APIRouter, Depends

from backend.auth import get_current_user
from backend.database import get_connection
from backend.models.log import LogResponse

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=List[LogResponse])
def get_logs(_: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 100"
        ).fetchall()
        return [
            LogResponse(
                id=r["id"],
                schedule_id=r["schedule_id"],
                device_id=r["device_id"],
                device_name=r["device_name"],
                action_json=json.loads(r["action_json"]),
                status=r["status"],
                error_message=r["error_message"],
                executed_at=r["executed_at"],
            )
            for r in rows
        ]
    finally:
        conn.close()
