"""Unified evaluation script for all 3 models + Weighted Ensemble on a held-out split.

Usage (when `aptos_512_clahe_balanced/test` is available):
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\evaluate_all_models.py --split-dir datasets/aptos_512_clahe_balanced/test
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
)

from app.ml.registry import MODEL_ORDER, get_registry


def evaluate_split(split_dir: Path, out_json: Path | None = None) -> dict:
    labels_csv = split_dir / "labels.csv"
    images_dir = split_dir / "images"
    if not labels_csv.is_file() or not images_dir.is_dir():
        raise FileNotFoundError(f"Expected {labels_csv} and {images_dir}")

    df = pd.read_csv(labels_csv)
    y_true = df["diagnosis"].to_numpy(dtype=np.int32)
    reg = get_registry()
    reg.load_all()

    probs_by_model: dict[str, list[np.ndarray]] = {k: [] for k in MODEL_ORDER}

    for row in df.itertuples(index=False):
        img_path = images_dir / f"{row.id_code}.png"
        with Image.open(img_path) as im:
            im_rgb = im.convert("RGB")
        for key in MODEL_ORDER:
            tensor = reg._prepare_tensor(key, im_rgb)
            probs = reg.get(key)(tensor, training=False).numpy()[0]
            probs_by_model[key].append(probs)

    weights = np.array([0.45, 0.35, 0.20], dtype=np.float32)
    summary: dict[str, dict] = {}

    for key in MODEL_ORDER:
        mat = np.stack(probs_by_model[key], axis=0)
        y_pred = mat.argmax(axis=1)
        summary[key] = _compute_metrics(y_true, y_pred)

    ens_mat = (
        weights[0] * np.stack(probs_by_model["efficientnet"], axis=0)
        + weights[1] * np.stack(probs_by_model["resnet50"], axis=0)
        + weights[2] * np.stack(probs_by_model["cnn"], axis=0)
    )
    summary["ensemble"] = _compute_metrics(y_true, ens_mat.argmax(axis=1))

    if out_json:
        out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "qwk": round(float(cohen_kappa_score(y_true, y_pred, weights="quadratic")), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3, 4]).tolist(),
        "report": classification_report(y_true, y_pred, labels=[0, 1, 2, 3, 4], output_dict=True, zero_division=0),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate all 3 APTOS DR models + ensemble on a split folder.")
    parser.add_argument("--split-dir", type=Path, required=True, help="Path to split folder containing labels.csv and images/")
    parser.add_argument("--out", type=Path, default=Path("unified_evaluation.json"), help="Output JSON path")
    args = parser.parse_args()
    results = evaluate_split(args.split_dir, args.out)
    for k, v in results.items():
        print(f"{k:14s} | Acc={v['accuracy']:.4f} | QWK={v['qwk']:.4f} | Macro-F1={v['macro_f1']:.4f}")


if __name__ == "__main__":
    main()

