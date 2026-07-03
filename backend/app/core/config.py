from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/photodelivery"
    SECRET_KEY: str = "change-me-in-production-min-32-chars-long"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    WATCH_FOLDER: str = "./uploads/_incoming"
    UPLOAD_FOLDER: str = "./uploads"
    BASE_URL: str = "http://localhost:3000"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
