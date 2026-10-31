"""Grad-CAM visual explanations for all three architectures (CNN, EfficientNetB0, ResNet50).

All three models share the structure:
    conv backbone / last conv block → GlobalAveragePooling2D → Dropout → Dense(5, softmax)
Using GradientTape on the spatial feature map before GAP gives exact Grad-CAM maps.
"""
from __future__ import annotations

import cv2
import keras
import numpy as np
import tensorflow as tf
from PIL import Image

from app.ml.preprocessing import to_data_url


def compute_gradcam_overlay(
    model_key: str,
    model: keras.Model,
    model_input: tf.Tensor,
    target_class: int,
    base_rgb_512: Image.Image,
    alpha: float = 0.42,
) -> str:
    """Compute a 512×512 Grad-CAM heatmap overlaid on the preprocessed fundus image and return a data URL."""
    heatmap = _compute_heatmap(model_key, model, model_input, target_class)
    base = np.asarray(base_rgb_512.convert("RGB"), dtype=np.uint8)
    h, w = base.shape[:2]

    heatmap_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    heatmap_uint8 = np.clip(heatmap_resized * 255.0, 0, 255).astype(np.uint8)
    colored_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)

    # Mask out the black padding around the circular fundus so the border stays clean.
    gray = base.mean(axis=2)
    mask = (gray > 10).astype(np.float32)[..., None]

    blended = base.astype(np.float32) * (1.0 - alpha * mask) + colored_rgb.astype(np.float32) * (alpha * mask)
    overlay = Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8))
    return to_data_url(overlay, fmt="JPEG", quality=88)


def compute_gradcam_bundle(
    model_key: str,
    model: keras.Model,
    model_input: tf.Tensor,
    target_class: int,
    base_rgb_512: Image.Image,
    alpha: float = 0.42,
) -> tuple[str, dict]:
    """Compute both the Grad-CAM overlay data URL and spatial quadrant attention statistics."""
    heatmap = _compute_heatmap(model_key, model, model_input, target_class)
    base = np.asarray(base_rgb_512.convert("RGB"), dtype=np.uint8)
    h, w = base.shape[:2]

    heatmap_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    heatmap_uint8 = np.clip(heatmap_resized * 255.0, 0, 255).astype(np.uint8)
    colored_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)

    gray = base.mean(axis=2)
    mask_2d = gray > 10
    mask = mask_2d.astype(np.float32)[..., None]

    blended = base.astype(np.float32) * (1.0 - alpha * mask) + colored_rgb.astype(np.float32) * (alpha * mask)
    overlay = Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8))
    data_url = to_data_url(overlay, fmt="JPEG", quality=88)

    stats = _extract_spatial_stats(heatmap_resized, mask_2d)
    return data_url, stats


def _extract_spatial_stats(heatmap_512: np.ndarray, retina_mask: np.ndarray) -> dict:
    """Quantify where in the retina the model's Grad-CAM activation is concentrated."""
    h, w = heatmap_512.shape[:2]
    cy, cx = h // 2, w // 2
    masked_cam = np.where(retina_mask, heatmap_512, 0.0)

    yy, xx = np.ogrid[:h, :w]
    dist_norm = np.sqrt(((yy - cy) / (h * 0.5)) ** 2 + ((xx - cx) / (w * 0.5)) ** 2)
    central_mask = retina_mask & (dist_norm <= 0.42)

    q_ul = masked_cam[:cy, :cx][retina_mask[:cy, :cx]]
    q_ur = masked_cam[:cy, cx:][retina_mask[:cy, cx:]]
    q_ll = masked_cam[cy:, :cx][retina_mask[cy:, :cx]]
    q_lr = masked_cam[cy:, cx:][retina_mask[cy:, cx:]]
    q_center = masked_cam[central_mask]

    def _mean(arr: np.ndarray) -> float:
        return round(float(arr.mean()), 3) if arr.size > 0 else 0.0

    quadrants = {
        "Superior-Temporal (Upper-Left)": _mean(q_ul),
        "Superior-Nasal (Upper-Right)": _mean(q_ur),
        "Inferior-Temporal (Lower-Left)": _mean(q_ll),
        "Inferior-Nasal (Lower-Right)": _mean(q_lr),
        "Central Macula & Foveal Zone": _mean(q_center),
    }
    dominant_region = max(quadrants.items(), key=lambda kv: kv[1])[0]
    sorted_regions = sorted(quadrants.items(), key=lambda kv: kv[1], reverse=True)
    secondary_region = sorted_regions[1][0] if len(sorted_regions) > 1 else dominant_region

    retina_pixels = masked_cam[retina_mask]
    hotspot_pct = (
        round(float((retina_pixels >= 0.60).sum() / max(1, retina_pixels.size) * 100.0), 1)
        if retina_pixels.size > 0
        else 0.0
    )
    peak_y, peak_x = np.unravel_index(int(np.argmax(masked_cam)), masked_cam.shape)

    return {
        "dominant_region": dominant_region,
        "secondary_region": secondary_region,
        "hotspot_coverage_pct": hotspot_pct,
        "peak_location": {
            "x_norm": round(float(peak_x / w), 2),
            "y_norm": round(float(peak_y / h), 2),
        },
        "region_scores": quadrants,
    }


def _compute_heatmap(
    model_key: str,
    model: keras.Model,
    model_input: tf.Tensor,
    target_class: int,
) -> np.ndarray:
    with tf.GradientTape() as tape:
        if model_key == "cnn":
            x = model_input
            conv_out = None
            for layer in model.layers:
                x = layer(x, training=False)
                if layer.name == "conv2d_2":
                    conv_out = x
                    tape.watch(conv_out)
            preds = x
        elif model_key == "efficientnet":
            backbone = model.get_layer("efficientnetb0")
            gap = model.get_layer("global_average_pooling2d")
            dense = model.get_layer("dense")
            conv_out = backbone(model_input, training=False)
            tape.watch(conv_out)
            x = gap(conv_out)
            preds = dense(x, training=False)
        elif model_key == "resnet50":
            backbone = model.get_layer("resnet50")
            gap = model.get_layer("global_average_pooling")
            dense = model.get_layer("severity")
            conv_out = backbone(model_input, training=False)
            tape.watch(conv_out)
            x = gap(conv_out)
            preds = dense(x, training=False)
        else:
            raise ValueError(f"Unknown model key for Grad-CAM: {model_key}")

        score = preds[:, target_class]

    grads = tape.gradient(score, conv_out)
    weights = tf.reduce_mean(grads, axis=(1, 2), keepdims=True)
    cam = tf.reduce_sum(weights * conv_out, axis=-1)[0]
    cam = tf.nn.relu(cam).numpy()
    max_val = float(cam.max())
    if max_val > 1e-8:
        cam = cam / max_val
    return cam

