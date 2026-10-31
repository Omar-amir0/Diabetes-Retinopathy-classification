"""Tests for the FastAPI backend, CLAHE preprocessing, 3-model inference, Grad-CAM, and ensemble."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_api_end_to_end() -> None:
    with TestClient(app) as client:
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert set(data["loaded_models"]) == {"efficientnet", "resnet50", "cnn"}

        r_models = client.get("/api/models")
        assert r_models.status_code == 200
        assert len(r_models.json()["models"]) == 3

        r_eda = client.get("/api/eda")
        assert r_eda.status_code == 200
        assert r_eda.json()["dataset"]["labelled_images"] == 3662

        r_cmp = client.post("/api/predict/sample/3?mode=compare&gradcam=true")
        assert r_cmp.status_code == 200
        cmp_json = r_cmp.json()
        assert "ensemble" in cmp_json
        assert len(cmp_json["models"]) == 3
        for m in cmp_json["models"]:
            assert m["gradcam_image"].startswith("data:image/jpeg;base64,")
            assert len(m["probabilities"]) == 5

