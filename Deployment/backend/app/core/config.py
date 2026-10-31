"""Application settings (override with environment variables prefixed ``DR_`` or a ``backend/.env`` file)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent
ARTEFACTS_DIR = PROJECT_DIR / "artefacts"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DR_", env_file=BACKEND_DIR / ".env", extra="ignore")

    app_name: str = "RetinaScan — Diabetic Retinopathy API"
    version: str = "1.0.0"

    cnn_path: Path = ARTEFACTS_DIR / "cnn_baseline" / "aptos_cnn_512_clahe.keras"
    efficientnet_path: Path = ARTEFACTS_DIR / "EfficientNet" / "efficientnetb0_aptos_complete_model.keras"
    resnet50_path: Path = (
        ARTEFACTS_DIR / "ResNet-20261028T212624Z-1-001" / "ResNet" / "resnet50_aptos_complete_model.keras"
    )

    data_dir: Path = BACKEND_DIR / "app" / "data"
    static_dir: Path = BACKEND_DIR / "static"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_upload_mb: float = 15.0
    preload_models: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
