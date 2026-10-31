"""Build web-ready assets from the research notebooks and artefacts.

Run once (or whenever notebooks change):
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\prepare_assets.py

Outputs
-------
backend/static/figures/*.webp        optimized figures (artefacts + images embedded in notebooks)
backend/static/samples/grade_*.jpg   demo fundus images cropped from clahe_preview.png
backend/app/data/training_history.json  per-epoch metrics parsed from the training logs
"""
from __future__ import annotations

import base64
import io
import json
import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

BACKEND = Path(__file__).resolve().parents[1]
PROJECT = BACKEND.parent
ARTEFACTS = PROJECT / "artefacts"
FIG_OUT = BACKEND / "static" / "figures"
SAMPLE_OUT = BACKEND / "static" / "samples"
DATA_OUT = BACKEND / "app" / "data"

NOTEBOOKS = {
    "eda": PROJECT / "EDA_and_audit_file.ipynb",
    "augmentation": PROJECT / "data_augmentation.ipynb",
    "cnn": PROJECT / "cnn_baseline_comparison.ipynb",
    "efficientnet": ARTEFACTS / "EfficientNet" / "EfficientNet.ipynb",
    "resnet50": ARTEFACTS / "ResNet-20261028T212624Z-1-001" / "ResNet" / "resnet50_aptos_finetuning.ipynb",
}

# Names for images embedded in notebooks that do not save to disk (order of appearance).
EMBEDDED_NAMES = {
    "augmentation": ["augmentation_preview"],
    "cnn": ["cnn_training_curves", "cnn_confusion_matrix"],
    "efficientnet": ["efficientnet_training_curves", "efficientnet_confusion_matrix"],
    "resnet50": ["resnet50_training_curves"],
}

EPOCH_RE = re.compile(
    r"accuracy: (?P<acc>[\d.]+) - loss: (?P<loss>[\d.]+) - val_accuracy: (?P<val_acc>[\d.]+)"
    r" - val_loss: (?P<val_loss>[\d.]+)"
)
ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def save_webp(image: Image.Image, name: str, max_width: int = 1600, quality: int = 82) -> Path:
    image = image.convert("RGB")
    if image.width > max_width:
        ratio = max_width / image.width
        image = image.resize((max_width, round(image.height * ratio)), Image.Resampling.LANCZOS)
    out = FIG_OUT / f"{name}.webp"
    image.save(out, "WEBP", quality=quality, method=6)
    return out


def convert_artefacts() -> list[str]:
    names = []
    for png in ARTEFACTS.rglob("*.png"):
        name = png.stem
        with Image.open(png) as im:
            save_webp(im, name)
        names.append(name)
    return names


def extract_notebook_images() -> list[str]:
    names = []
    for key, path in NOTEBOOKS.items():
        nb = json.loads(path.read_text(encoding="utf-8"))
        pending_name = None
        embedded_index = 0
        for cell in nb["cells"]:
            for output in cell.get("outputs", []):
                text = "".join(output.get("text", []))
                match = re.search(r"Saved graph: .*[\\/](?P<n>[^\\/]+)\.png", text)
                if match:
                    pending_name = match.group("n")
                data = output.get("data", {})
                if "image/png" not in data:
                    continue
                if key == "eda" and pending_name:
                    name = pending_name
                else:
                    options = EMBEDDED_NAMES.get(key, [])
                    name = options[embedded_index] if embedded_index < len(options) else f"{key}_figure_{embedded_index}"
                    embedded_index += 1
                pending_name = None
                raw = base64.b64decode(data["image/png"])
                with Image.open(io.BytesIO(raw)) as im:
                    save_webp(im, name)
                names.append(name)
    return names


def parse_histories() -> dict:
    histories = {}
    for key in ("cnn", "efficientnet", "resnet50"):
        nb = json.loads(NOTEBOOKS[key].read_text(encoding="utf-8"))
        text = ""
        for cell in nb["cells"]:
            for output in cell.get("outputs", []):
                text += "".join(output.get("text", []))
        text = ANSI_RE.sub("", text)
        epochs = []
        for i, m in enumerate(EPOCH_RE.finditer(text), start=1):
            epochs.append({
                "epoch": i,
                "accuracy": float(m["acc"]),
                "loss": float(m["loss"]),
                "val_accuracy": float(m["val_acc"]),
                "val_loss": float(m["val_loss"]),
            })
        histories[key] = epochs
    return histories


def extract_samples() -> list[str]:
    """Crop the 5 'Original' fundus panels (left column) from clahe_preview.png."""
    src = ARTEFACTS / "EDA&preprocessing" / "clahe_preview.png"
    rgb = np.asarray(Image.open(src).convert("RGB"))
    left = rgb[:, : rgb.shape[1] // 2]
    # Image panels are the large non-white regions; titles are small text blobs.
    non_white = (left.min(axis=2) < 235).astype(np.uint8)
    count, _, stats, _ = cv2.connectedComponentsWithStats(non_white, connectivity=8)
    boxes = [s for s in stats[1:] if s[cv2.CC_STAT_AREA] > 50_000]
    boxes.sort(key=lambda s: s[cv2.CC_STAT_TOP])
    names = []
    for grade, s in enumerate(boxes[:5]):
        x, y, w, h = s[0], s[1], s[2], s[3]
        crop = Image.fromarray(left[y : y + h, x : x + w])
        out = SAMPLE_OUT / f"grade_{grade}.jpg"
        crop.save(out, "JPEG", quality=95)
        names.append(f"{out.name} ({w}x{h})")
    return names


def main() -> None:
    for folder in (FIG_OUT, SAMPLE_OUT, DATA_OUT):
        folder.mkdir(parents=True, exist_ok=True)
    print("Artefact figures:", convert_artefacts())
    print("Notebook figures:", extract_notebook_images())
    histories = parse_histories()
    (DATA_OUT / "training_history.json").write_text(json.dumps(histories, indent=1), encoding="utf-8")
    print("Histories:", {k: len(v) for k, v in histories.items()})
    print("Samples:", extract_samples())


if __name__ == "__main__":
    main()

