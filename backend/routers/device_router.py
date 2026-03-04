from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.switchbot_api import get_devices, send_command

router = APIRouter(prefix="/api/devices", tags=["devices"])


class CommandRequest(BaseModel):
    command: str
    parameter: str = "default"
    commandType: str = "command"


@router.get("")
async def list_devices(_: str = Depends(get_current_user)):
    try:
        return await get_devices()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/{device_id}/command")
async def device_command(
    device_id: str,
    body: CommandRequest,
    _: str = Depends(get_current_user),
):
    try:
        return await send_command(
            device_id=device_id,
            command=body.command,
            parameter=body.parameter,
            command_type=body.commandType,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
