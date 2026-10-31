"""FastAPI entry point for the Diabetic Retinopathy Severity Classification backend."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.core.config import get_settings
from app.ml.registry import get_registry


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.preload_models:
        get_registry().load_all()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=(
            "APTOS 2019 Blindness Detection — 5-grade Diabetic Retinopathy classification "
            "with CLAHE preprocessing, Grad-CAM explainability, and 3-model ensemble (Custom CNN, EfficientNetB0, ResNet50)."
        ),
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    settings.static_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
    return app


app = create_app()

