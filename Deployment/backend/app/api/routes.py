"""API routes for health, metadata, EDA, sample images, single-model inference, and 3-model ensemble comparison."""
from __future__ import annotations

import json
from typing import Any, Literal

from fastapi import APIRouter, File, HTTPException, Path as ApiPath, Query, UploadFile
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.ml.llm_explainer import generate_live_llm_explanation
from app.ml.preprocessing import InvalidImageError, load_image
from app.ml.registry import ModelKey, get_registry

router = APIRouter(prefix="/api")


class ExplainRequest(BaseModel):
    prediction_payload: dict[str, Any]
    language: Literal["ar", "en"] = "ar"
    user_question: str | None = None
    api_key: str | None = None
    provider: Literal["auto", "gemini", "groq", "openai"] = "auto"
    conversation_history: list[dict[str, str]] = Field(default_factory=list)


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    reg = get_registry()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "loaded_models": reg.loaded_keys,
        "available_models": ["efficientnet", "resnet50", "cnn"],
    }


@router.get("/models")
def get_models_metadata() -> dict:
    settings = get_settings()
    models_data = json.loads((settings.data_dir / "models.json").read_text(encoding="utf-8"))
    history_path = settings.data_dir / "training_history.json"
    histories = json.loads(history_path.read_text(encoding="utf-8")) if history_path.is_file() else {}
    for model in models_data["models"]:
        model["history"] = histories.get(model["key"], [])
    return models_data


@router.get("/eda")
def get_eda_metadata() -> dict:
    settings = get_settings()
    return json.loads((settings.data_dir / "eda.json").read_text(encoding="utf-8"))


@router.get("/samples")
def list_samples() -> dict:
    reg = get_registry()
    return {
        "samples": [
            {
                "grade": c["grade"],
                "label": c["label"],
                "short": c["short"],
                "color": c["color"],
                "description": c["description"],
                "url": f"/static/samples/grade_{c['grade']}.jpg",
            }
            for c in reg.classes
        ]
    }


async def _read_upload(file: UploadFile) -> bytes:
    settings = get_settings()
    data = await file.read()
    max_bytes = int(settings.max_upload_mb * 1024 * 1024)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB limit.")
    return data


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: ModelKey = Query("efficientnet", description="Model to run: efficientnet | resnet50 | cnn"),
    gradcam: bool = Query(True, description="Include Grad-CAM attention overlay"),
) -> dict:
    data = await _read_upload(file)
    try:
        image = load_image(data)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return get_registry().predict_one(image, key=model, include_gradcam=gradcam)


@router.post("/predict/compare")
async def predict_compare(
    file: UploadFile = File(...),
    gradcam: bool = Query(True, description="Include Grad-CAM attention overlay for each model"),
) -> dict:
    data = await _read_upload(file)
    try:
        image = load_image(data)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return get_registry().predict_compare(image, include_gradcam=gradcam)


@router.post("/predict/sample/{grade}")
def predict_sample(
    grade: int = ApiPath(..., ge=0, le=4),
    mode: Literal["single", "compare"] = Query("compare"),
    model: ModelKey = Query("efficientnet"),
    gradcam: bool = Query(True),
) -> dict:
    settings = get_settings()
    sample_path = settings.static_dir / "samples" / f"grade_{grade}.jpg"
    if not sample_path.is_file():
        raise HTTPException(status_code=404, detail=f"Sample for grade {grade} not found.")
    image = load_image(sample_path.read_bytes())
    reg = get_registry()
    if mode == "single":
        out = reg.predict_one(image, key=model, include_gradcam=gradcam)
    else:
        out = reg.predict_compare(image, include_gradcam=gradcam)
    out["ground_truth_grade"] = grade
    return out


@router.post("/explain")
def explain_prediction(req: ExplainRequest) -> dict:
    """Generate a clinical explanation (or answer a follow-up question) using the System Prompt + LLM."""
    return generate_live_llm_explanation(
        payload=req.prediction_payload,
        language=req.language,
        user_question=req.user_question,
        api_key=req.api_key,
        provider=req.provider,
        conversation_history=req.conversation_history,
    )
