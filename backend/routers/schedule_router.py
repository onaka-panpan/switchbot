import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from backend.auth import get_current_user
from backend.database import get_connection
from backend.models.schedule import ScheduleCreate, ScheduleResponse, ScheduleUpdate
from backend.scheduler import register_schedule, remove_schedule

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


def _row_to_response(row) -> ScheduleResponse:
    return ScheduleResponse(
        id=row["id"],
        name=row["name"],
        schedule_type=row["schedule_type"],
        days_of_week=row["days_of_week"],
        execute_date=row["execute_date"],
        execute_time=row["execute_time"],
        device_id=row["device_id"],
        device_name=row["device_name"],
        action_json=json.loads(row["action_json"]),
        is_enabled=bool(row["is_enabled"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=List[ScheduleResponse])
def list_schedules(_: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM schedules ORDER BY created_at DESC"
        ).fetchall()
        return [_row_to_response(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=ScheduleResponse, status_code=201)
def create_schedule(body: ScheduleCreate, _: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.execute(
            """INSERT INTO schedules
               (name, schedule_type, days_of_week, execute_date, execute_time,
                device_id, device_name, action_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                body.name,
                body.schedule_type,
                body.days_of_week,
                body.execute_date,
                body.execute_time,
                body.device_id,
                body.device_name,
                json.dumps(body.action_json),
            ),
        )
        conn.commit()
        schedule_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        register_schedule(schedule_id)
        return _row_to_response(row)
    finally:
        conn.close()


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int, body: ScheduleUpdate, _: str = Depends(get_current_user)
):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Schedule not found")
        conn.execute(
            """UPDATE schedules SET
               name=?, schedule_type=?, days_of_week=?, execute_date=?,
               execute_time=?, device_id=?, device_name=?, action_json=?,
               updated_at=CURRENT_TIMESTAMP
               WHERE id=?""",
            (
                body.name,
                body.schedule_type,
                body.days_of_week,
                body.execute_date,
                body.execute_time,
                body.device_id,
                body.device_name,
                json.dumps(body.action_json),
                schedule_id,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        register_schedule(schedule_id)
        return _row_to_response(row)
    finally:
        conn.close()


@router.patch("/{schedule_id}/toggle", response_model=ScheduleResponse)
def toggle_schedule(schedule_id: int, _: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Schedule not found")
        new_state = 0 if row["is_enabled"] else 1
        conn.execute(
            "UPDATE schedules SET is_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (new_state, schedule_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        register_schedule(schedule_id)
        return _row_to_response(row)
    finally:
        conn.close()


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, _: str = Depends(get_current_user)):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Schedule not found")
        conn.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
        conn.commit()
        remove_schedule(schedule_id)
    finally:
        conn.close()
