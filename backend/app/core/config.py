"""
Configuration centralisée de l'application (variables d'environnement).
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "RetrouvCI API"
    ENV: str = "development"
    SECRET_KEY: str = "change-moi-en-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 jours

    DATABASE_URL: str = "postgresql+asyncpg://retrouvci_user:retrouvci_pass@db:5432/retrouvci"

    STORAGE_BACKEND: str = "local"  # local | cloudinary | s3
    CLOUDINARY_URL: str | None = None
    S3_ENDPOINT_URL: str | None = None
    S3_BUCKET_NAME: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://retrouvci.ci"]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
