from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db, seed_default_user
from backend.scheduler import load_schedules_from_db, scheduler
from backend.routers import (
    auth_router,
    device_router,
    log_router,
    schedule_router,
    settings_router,
)

app = FastAPI(title="SwitchBot Controller")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(device_router.router)
app.include_router(schedule_router.router)
app.include_router(log_router.router)
app.include_router(settings_router.router)

STATIC_DIR = Path("frontend/dist")


@app.on_event("startup")
async def startup():
    init_db()
    seed_default_user()
    load_schedules_from_db()
    scheduler.start()


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown(wait=False)


if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(str(STATIC_DIR / "index.html"))
