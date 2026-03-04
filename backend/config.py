from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    switchbot_api_token: Optional[str] = None
    switchbot_api_secret: Optional[str] = None

    jwt_secret: str = "change-this-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    database_path: str = "data/app.db"

    class Config:
        env_file = ".env"


settings = Settings()
