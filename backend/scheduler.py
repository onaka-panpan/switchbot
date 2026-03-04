import asyncio
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from backend.database import get_connection
from backend.switchbot_api import send_command

TZ = ZoneInfo("Asia/Tokyo")
logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone=TZ)

DAY_MAP = {
    "mon": "mon",
    "tue": "tue",
    "wed": "wed",
    "thu": "thu",
    "fri": "fri",
    "sat": "sat",
    "sun": "sun",
}


async def _execute_schedule(schedule_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        if not row or not row["is_enabled"]:
            return

        action = json.loads(row["action_json"])
        try:
            result = await send_command(
                device_id=row["device_id"],
                command=action.get("command", "turnOn"),
                parameter=action.get("parameter", "default"),
                command_type=action.get("commandType", "command"),
            )
            status = "success"
            error_message = None
        except Exception as e:
            status = "failure"
            error_message = str(e)
            logger.error("Schedule %d failed: %s", schedule_id, e)

        conn.execute(
            """INSERT INTO execution_logs
               (schedule_id, device_id, device_name, action_json, status, error_message)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                schedule_id,
                row["device_id"],
                row["device_name"],
                row["action_json"],
                status,
                error_message,
            ),
        )

        if row["schedule_type"] == "once" and status == "success":
            conn.execute(
                "UPDATE schedules SET is_enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (schedule_id,),
            )
        conn.commit()
    finally:
        conn.close()


def _register_job(row):
    schedule_id = row["id"]
    job_id = f"schedule_{schedule_id}"

    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    if not row["is_enabled"]:
        return

    hour, minute = row["execute_time"].split(":")

    if row["schedule_type"] == "recurring":
        days = row["days_of_week"] or "mon,tue,wed,thu,fri,sat,sun"
        day_of_week = ",".join(DAY_MAP.get(d.strip(), d.strip()) for d in days.split(","))
        trigger = CronTrigger(
            day_of_week=day_of_week, hour=int(hour), minute=int(minute), timezone=TZ
        )
    else:
        run_date = datetime.strptime(
            f"{row['execute_date']} {row['execute_time']}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=TZ)
        trigger = DateTrigger(run_date=run_date, timezone=TZ)

    scheduler.add_job(
        _execute_schedule,
        trigger=trigger,
        args=[schedule_id],
        id=job_id,
        replace_existing=True,
    )


def load_schedules_from_db():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM schedules WHERE is_enabled = 1").fetchall()
        for row in rows:
            _register_job(row)
    finally:
        conn.close()


def register_schedule(schedule_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ).fetchone()
        if row:
            _register_job(row)
    finally:
        conn.close()


def remove_schedule(schedule_id: int):
    job_id = f"schedule_{schedule_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
