from typing import Any, Dict, Optional
from pydantic import BaseModel


class LogResponse(BaseModel):
    id: int
    schedule_id: Optional[int]
    device_id: str
    device_name: str
    action_json: Dict[str, Any]
    status: str
    error_message: Optional[str]
    executed_at: str
