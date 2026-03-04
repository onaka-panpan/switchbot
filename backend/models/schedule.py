from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ScheduleCreate(BaseModel):
    name: str
    schedule_type: str  # "recurring" | "once"
    days_of_week: Optional[str] = None  # "mon,tue,wed"
    execute_date: Optional[str] = None  # "YYYY-MM-DD"
    execute_time: str  # "HH:MM"
    device_id: str
    device_name: str
    action_json: Dict[str, Any]


class ScheduleUpdate(ScheduleCreate):
    pass


class ScheduleResponse(BaseModel):
    id: int
    name: str
    schedule_type: str
    days_of_week: Optional[str]
    execute_date: Optional[str]
    execute_time: str
    device_id: str
    device_name: str
    action_json: Dict[str, Any]
    is_enabled: bool
    created_at: str
    updated_at: str
