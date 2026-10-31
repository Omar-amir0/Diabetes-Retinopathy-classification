"""Fundus image preprocessing — mirrors ``Preprocessing.py`` (CLAHE variant) used to build the training data.

Training pipeline reproduced here:
    EXIF transpose → RGB → CLAHE on LAB-L (clip 2.0, 8×8) → aspect-preserving Lanczos pad to 512×512
    → per-model resize (tf.image.resize, lanczos3) → optional model-specific preprocess_input.
"""
from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

TARGET_SIZE = (512, 512)
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID = (8, 8)
MIN_SIDE = 128


class InvalidImageError(ValueError):
    """Raised when the uploaded bytes are not a usable image."""


def load_image(data: bytes) -> Image.Image:
    if not data:
        raise InvalidImageError("The uploaded file is empty.")
    try:
        with Image.open(io.BytesIO(data)) as source:
            source.load()
            image = ImageOps.exif_transpose(source).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImageError("The file could not be decoded as an image.") from exc
    if min(image.size) < MIN_SIDE:
        raise InvalidImageError(f"Image is too small ({image.width}×{image.height}); minimum side is {MIN_SIDE}px.")
    return image


def apply_clahe(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    lightness, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP_LIMIT, tileGridSize=CLAHE_TILE_GRID)
    enhanced = cv2.cvtColor(cv2.merge((clahe.apply(lightness), a, b)), cv2.COLOR_LAB2RGB)
    return Image.fromarray(enhanced)


def pad_to_square(image: Image.Image, size: tuple[int, int] = TARGET_SIZE) -> Image.Image:
    return ImageOps.pad(image, size, method=Image.Resampling.LANCZOS, color=(0, 0, 0), centering=(0.5, 0.5))


def preprocess_fundus(image: Image.Image) -> Image.Image:
    """Return the 512×512 CLAHE image exactly as stored in the training dataset."""
    return pad_to_square(apply_clahe(image))


def quality_warnings(image: Image.Image) -> list[str]:
    """Cheap heuristics that flag images unlikely to be usable fundus photographs."""
    warnings: list[str] = []
    small = np.asarray(image.convert("RGB").resize((128, 128)), dtype=np.float32) / 255.0
    gray = small @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    roi = gray > 8 / 255
    if roi.mean() < 0.2:
        warnings.append("Image is mostly dark — the retina may be under-exposed.")
    elif roi.mean() > 0.97:
        warnings.append("No dark border detected — this may not be a fundus photograph.")
    if roi.any():
        mean_rgb = small[roi].mean(axis=0)
        if not (mean_rgb[0] >= mean_rgb[2]):
            warnings.append("Colour profile is unusual for a fundus photograph (expected red/orange tones).")
        if gray[roi].mean() < 0.12:
            warnings.append("Very low brightness — prediction reliability may be reduced.")
    if min(image.size) < 400:
        warnings.append("Low resolution image — fine lesions such as microaneurysms may be missed.")
    return warnings


def to_data_url(image: Image.Image, fmt: str = "JPEG", quality: int = 88) -> str:
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format=fmt, quality=quality)
    mime = "image/jpeg" if fmt.upper() == "JPEG" else f"image/{fmt.lower()}"
    return f"data:{mime};base64,{base64.b64encode(buffer.getvalue()).decode()}"

