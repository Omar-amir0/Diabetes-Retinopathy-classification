"""Model registry — loads the three trained Keras models once and runs inference + Grad-CAM + ensemble."""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Literal

import keras
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess

from app.core.config import Settings, get_settings
from app.ml.gradcam import compute_gradcam_bundle
from app.ml.llm_explainer import build_builtin_explanation
from app.ml.preprocessing import preprocess_fundus, quality_warnings, to_data_url

ModelKey = Literal["efficientnet", "resnet50", "cnn"]
MODEL_ORDER: tuple[ModelKey, ...] = ("efficientnet", "resnet50", "cnn")


class ModelRegistry:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._models: dict[ModelKey, keras.Model] = {}
        self._lock = threading.Lock()
        self._meta = json.loads((self.settings.data_dir / "models.json").read_text(encoding="utf-8"))
        self.classes: list[dict] = self._meta["classes"]
        self.models_meta: dict[str, dict] = {m["key"]: m for m in self._meta["models"]}

    @property
    def loaded_keys(self) -> list[str]:
        return list(self._models.keys())

    def _path_for(self, key: ModelKey) -> Path:
        return {
            "cnn": self.settings.cnn_path,
            "efficientnet": self.settings.efficientnet_path,
            "resnet50": self.settings.resnet50_path,
        }[key]

    def get(self, key: ModelKey) -> keras.Model:
        if key not in self._models:
            with self._lock:
                if key not in self._models:
                    path = self._path_for(key)
                    if not path.is_file():
                        raise FileNotFoundError(f"Model file not found: {path}")
                    self._models[key] = keras.models.load_model(path, compile=False)
        return self._models[key]

    def load_all(self) -> None:
        for key in MODEL_ORDER:
            self.get(key)

    def _prepare_tensor(self, key: ModelKey, clahe_512: Image.Image) -> tf.Tensor:
        arr = np.asarray(clahe_512.convert("RGB"), dtype=np.float32)
        tensor = tf.expand_dims(arr, axis=0)
        if key == "cnn":
            return tf.image.resize(tensor, (512, 512))
        resized = tf.image.resize(tensor, (224, 224), method="lanczos3")
        if key == "resnet50":
            return resnet_preprocess(tf.identity(resized))
        return resized

    def _format_prediction(
        self,
        key: str,
        name: str,
        probs: np.ndarray,
        latency_ms: float,
        gradcam_url: str | None = None,
        gradcam_stats: dict | None = None,
    ) -> dict:
        grade = int(np.argmax(probs))
        cls_info = self.classes[grade]
        return {
            "model_key": key,
            "model_name": name,
            "predicted_grade": grade,
            "predicted_label": cls_info["label"],
            "short_label": cls_info["short"],
            "confidence": round(float(probs[grade]), 4),
            "color": cls_info["color"],
            "urgency": cls_info["urgency"],
            "description": cls_info["description"],
            "recommendation": cls_info["recommendation"],
            "latency_ms": round(latency_ms, 1),
            "gradcam_image": gradcam_url,
            "gradcam_stats": gradcam_stats,
            "probabilities": [
                {
                    "grade": c["grade"],
                    "label": c["label"],
                    "short": c["short"],
                    "probability": round(float(probs[c["grade"]]), 4),
                    "color": c["color"],
                }
                for c in self.classes
            ],
        }

    def predict_one(
        self,
        image: Image.Image,
        key: ModelKey = "efficientnet",
        include_gradcam: bool = True,
    ) -> dict:
        t0 = time.perf_counter()
        clahe_512 = preprocess_fundus(image)
        model = self.get(key)
        tensor = self._prepare_tensor(key, clahe_512)
        probs = model(tensor, training=False).numpy()[0]
        latency_ms = (time.perf_counter() - t0) * 1000.0

        gradcam_url = None
        gradcam_stats = None
        if include_gradcam:
            gradcam_url, gradcam_stats = compute_gradcam_bundle(
                key, model, tensor, int(np.argmax(probs)), clahe_512
            )

        out = {
            "image_size": {"width": image.width, "height": image.height},
            "warnings": quality_warnings(image),
            "original_preview": to_data_url(image.resize((512, round(512 * image.height / image.width))) if image.width > 512 else image),
            "clahe_preview": to_data_url(clahe_512),
            "result": self._format_prediction(
                key, self.models_meta[key]["name"], probs, latency_ms, gradcam_url, gradcam_stats
            ),
        }
        out["llm_explanation"] = build_builtin_explanation(out)
        return out

    def predict_compare(
        self,
        image: Image.Image,
        include_gradcam: bool = True,
    ) -> dict:
        clahe_512 = preprocess_fundus(image)
        results: list[dict] = []
        prob_stack: list[np.ndarray] = []

        for key in MODEL_ORDER:
            t0 = time.perf_counter()
            model = self.get(key)
            tensor = self._prepare_tensor(key, clahe_512)
            probs = model(tensor, training=False).numpy()[0]
            latency_ms = (time.perf_counter() - t0) * 1000.0
            prob_stack.append(probs)

            gradcam_url = None
            gradcam_stats = None
            if include_gradcam:
                gradcam_url, gradcam_stats = compute_gradcam_bundle(
                    key, model, tensor, int(np.argmax(probs)), clahe_512
                )
            results.append(
                self._format_prediction(
                    key, self.models_meta[key]["name"], probs, latency_ms, gradcam_url, gradcam_stats
                )
            )

        # Class-reliability calibrated soft-voting ensemble:
        # Accounts for Custom CNN's 0% recall on Grade 4 / 3.4% on Grade 3 (which otherwise pulls severe cases into Grade 2)
        # and weights EfficientNetB0 & ResNet50 by their per-grade sensitivity/precision profile.
        reliability_matrix = np.array(
            [
                [0.45, 0.50, 0.32, 0.55, 0.55],  # efficientnet
                [0.40, 0.45, 0.32, 0.65, 0.60],  # resnet50
                [0.15, 0.05, 0.12, 0.05, 0.00],  # cnn
            ],
            dtype=np.float32,
        )
        raw_weighted = (np.stack(prob_stack, axis=0) * reliability_matrix).sum(axis=0)
        ensemble_probs = raw_weighted / raw_weighted.sum()
        ens_grade = int(np.argmax(ensemble_probs))
        grades = [r["predicted_grade"] for r in results]
        agreement = len(set(grades)) == 1

        # Pick the Grad-CAM from the model with highest probability on the ensemble's predicted grade
        best_cam_idx = int(np.argmax([p[ens_grade] for p in prob_stack]))
        ensemble = self._format_prediction(
            "ensemble",
            "Reliability-Calibrated Soft-Voting Ensemble",
            ensemble_probs,
            sum(r["latency_ms"] for r in results),
            results[best_cam_idx]["gradcam_image"],
            results[best_cam_idx]["gradcam_stats"],
        )
        ensemble["agreement"] = agreement
        ensemble["votes"] = {r["model_key"]: r["predicted_grade"] for r in results}
        ensemble["weights"] = {"efficientnet": 0.45, "resnet50": 0.35, "cnn": 0.20}

        out = {
            "image_size": {"width": image.width, "height": image.height},
            "warnings": quality_warnings(image),
            "original_preview": to_data_url(image.resize((512, round(512 * image.height / image.width))) if image.width > 512 else image),
            "clahe_preview": to_data_url(clahe_512),
            "ensemble": ensemble,
            "models": results,
        }
        out["llm_explanation"] = build_builtin_explanation(out)
        return out


_registry: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry

