from __future__ import annotations

import argparse
import json
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
from PIL import Image, ImageOps, UnidentifiedImageError
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
TARGET_SIZE = (512, 512)
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID = (8, 8)
BEN_GRAHAM_SIGMA = 10.0
BEN_GRAHAM_STRENGTH = 4.0
BEN_GRAHAM_BIAS = 128.0


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create an optional APTOS preprocessing variant."
    )
    parser.add_argument(
        "--variant", choices=["clahe", "ben_graham"], required=True,
        help="Which alternative preprocessing to run."
    )
    parser.add_argument(
        "--preview-only", action="store_true",
        help="Save a small visual comparison only; do not process the full dataset."
    )
    return parser.parse_args()


def load_csv(path: Path, split: str) -> pd.DataFrame:
    if not path.is_file():
        raise FileNotFoundError(f"Missing CSV: {path}")
    frame = pd.read_csv(path)
    if "id_code" not in frame.columns:
        raise ValueError(f"{path.name} needs an id_code column")
    if frame["id_code"].isna().any():
        raise ValueError(f"{path.name} has empty IDs")
    frame["id_code"] = frame["id_code"].astype(str).str.strip()
    if (frame["id_code"] == "").any() or frame["id_code"].duplicated().any():
        raise ValueError(f"{path.name} contains empty or duplicate IDs")
    if split == "train":
        if "diagnosis" not in frame.columns or frame["diagnosis"].isna().any():
            raise ValueError("train.csv needs non-missing diagnosis labels")
        labels = pd.to_numeric(frame["diagnosis"], errors="coerce")
        if labels.isna().any() or not labels.isin([0, 1, 2, 3, 4]).all():
            raise ValueError("Training labels must be 0, 1, 2, 3, or 4")
        if not (labels == labels.astype(int)).all():
            raise ValueError("Training labels must be whole numbers")
        frame["diagnosis"] = labels.astype(int)
    return frame


def index_images(folder: Path) -> dict[str, list[Path]]:
    if not folder.is_dir():
        raise FileNotFoundError(f"Missing image folder: {folder}")
    result: dict[str, list[Path]] = {}
    for path in folder.iterdir():
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            result.setdefault(path.stem, []).append(path)
    return result


def resolve_images(frame: pd.DataFrame, folder: Path) -> dict[str, Path]:
    lookup = index_images(folder)
    resolved = {}
    for image_id in frame["id_code"]:
        matches = lookup.get(image_id, [])
        if len(matches) != 1:
            raise ValueError(
                f"{folder.name}: ID {image_id} should match one file; found {len(matches)}"
            )
        resolved[image_id] = matches[0]
    extras = sorted(set(lookup) - set(frame["id_code"]))
    if extras:
        raise ValueError(f"Unreferenced images in {folder.name}: {extras[:10]}")
    return resolved


def apply_variant(image: Image.Image, variant: str) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)

    if variant == "clahe":
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
        lightness, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(
            clipLimit=CLAHE_CLIP_LIMIT,
            tileGridSize=CLAHE_TILE_GRID,
        )
        enhanced_l = clahe.apply(lightness)
        enhanced_lab = cv2.merge((enhanced_l, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
        return Image.fromarray(enhanced)

    if variant == "ben_graham":
        rgb_float = rgb.astype(np.float32)
        blurred = cv2.GaussianBlur(
            rgb_float, (0, 0), sigmaX=BEN_GRAHAM_SIGMA
        )
        enhanced = (
            BEN_GRAHAM_STRENGTH * (rgb_float - blurred)
            + BEN_GRAHAM_BIAS
        )
        enhanced = np.clip(enhanced, 0, 255).astype(np.uint8)
        return Image.fromarray(enhanced)

    raise ValueError(f"Unsupported variant: {variant}")


def load_source(path: Path) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        return ImageOps.exif_transpose(source).convert("RGB")


def make_output_image(source_path: Path, variant: str) -> Image.Image:
    image = load_source(source_path)
    image = apply_variant(image, variant)
    return ImageOps.pad(
        image,
        TARGET_SIZE,
        method=Image.Resampling.LANCZOS,
        color=(0, 0, 0),
        centering=(0.5, 0.5),
    )


def create_preview(variant: str, train_df: pd.DataFrame, resolved: dict[str, Path]):
    rows = []
    for grade in range(5):
        candidates = train_df[train_df["diagnosis"] == grade]
        if candidates.empty:
            continue
        row = candidates.iloc[0]
        rows.append((grade, str(row["id_code"]), resolved[str(row["id_code"])]))

    fig, axes = plt.subplots(len(rows), 2, figsize=(10, 3.4 * len(rows)))
    if len(rows) == 1:
        axes = np.array([axes])
    for index, (grade, image_id, image_path) in enumerate(rows):
        original = load_source(image_path)
        enhanced = apply_variant(original, variant)
        axes[index, 0].imshow(original)
        axes[index, 0].set_title(f"Grade {grade} - Original")
        axes[index, 1].imshow(enhanced)
        axes[index, 1].set_title(f"Grade {grade} - {variant}")
        for ax in axes[index]:
            ax.axis("off")
    fig.tight_layout()
    out = ROOT / f"{variant}_preview.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Preview saved to: {out}")
    print("Preview mode only: full dataset was not changed or generated.")


def main():
    args = parse_args()
    variant = args.variant
    train_df = load_csv(ROOT / "train.csv", "train")
    test_df = load_csv(ROOT / "test.csv", "test")
    if set(train_df["id_code"]) & set(test_df["id_code"]):
        raise ValueError("Train/test IDs overlap")

    train_sources = resolve_images(train_df, ROOT / "train_images")
    test_sources = resolve_images(test_df, ROOT / "test_images")

    if args.preview_only:
        create_preview(variant, train_df, train_sources)
        return

    out_dir = ROOT / f"preprocessed_aptos_512_{variant}"
    if out_dir.exists() and any(out_dir.iterdir()):
        raise FileExistsError(
            f"Output directory already exists and is not empty: {out_dir}. "
            "Rename it or remove it before rerunning."
        )

    manifest = []
    for split, frame, sources in (
        ("train", train_df, train_sources),
        ("test", test_df, test_sources),
    ):
        output_images = out_dir / f"{split}_images"
        output_images.mkdir(parents=True, exist_ok=True)
        labels = dict(zip(frame["id_code"], frame["diagnosis"])) if split == "train" else {}

        for index, image_id in enumerate(frame["id_code"], start=1):
            output_path = output_images / f"{image_id}.png"
            processed = make_output_image(sources[image_id], variant)
            processed.save(output_path, format="PNG", compress_level=6)
            with Image.open(output_path) as check:
                check.load()
                if check.size != TARGET_SIZE or check.mode != "RGB":
                    raise ValueError(f"Output check failed: {output_path}")
            manifest.append({
                "split": split,
                "id_code": image_id,
                "diagnosis": int(labels[image_id]) if split == "train" else None,
                "source_file": str(sources[image_id].relative_to(ROOT)),
                "output_file": str(output_path.relative_to(out_dir)),
                "output_width": TARGET_SIZE[0],
                "output_height": TARGET_SIZE[1],
                "output_mode": "RGB",
                "variant": variant,
            })
            if index % 250 == 0:
                print(f"{split}: processed {index}/{len(frame)}")

        frame.to_csv(out_dir / f"{split}.csv", index=False)

    submission = ROOT / "sample_submission.csv"
    if submission.is_file():
        shutil.copy2(submission, out_dir / submission.name)

    pd.DataFrame(manifest).to_csv(out_dir / "image_manifest.csv", index=False)
    report = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": "APTOS 2019 Blindness Detection",
        "variant": variant,
        "target_size": list(TARGET_SIZE),
        "format": "PNG",
        "color_mode": "RGB",
        "resize": "Lanczos; preserve aspect ratio; centered black padding",
        "orientation": "EXIF transpose if available",
        "clahe": {
            "clip_limit": CLAHE_CLIP_LIMIT,
            "tile_grid": list(CLAHE_TILE_GRID),
            "applied": variant == "clahe",
            "operation": "LAB L channel only",
        },
        "ben_graham": {
            "sigma": BEN_GRAHAM_SIGMA,
            "strength": BEN_GRAHAM_STRENGTH,
            "bias": BEN_GRAHAM_BIAS,
            "applied": variant == "ben_graham",
            "formula": "clip(strength * (image - gaussian_blur(image)) + bias, 0, 255)",
        },
        "cropping": "not applied",
        "normalization": "not applied; PNG channel values remain 0-255",
        "train_count": int(len(train_df)),
        "test_count": int(len(test_df)),
        "train_label_distribution": {
            str(int(k)): int(v) for k, v in sorted(Counter(train_df["diagnosis"]).items())
        },
        "original_images_modified": False,
        "note": "Experimental variant; do not assume it improves model accuracy without validation.",
    }
    (out_dir / "preprocessing_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    readme = (
        f"APTOS {variant.upper()} VARIANT\n\n"
        f"Variant: {variant}\nOutput: RGB PNG, {TARGET_SIZE[0]}x{TARGET_SIZE[1]}\n"
        "The source images are not modified. Aspect ratio is preserved and centered black padding is used.\n"
        "This is an experimental preprocessing variant, not a claim of improved accuracy.\n"
        "Compare with the baseline using the same validation split and metrics.\n"
    )
    (out_dir / "README.txt").write_text(readme, encoding="utf-8")
    print("\nVARIANT PREPROCESSING COMPLETED")
    print(f"Variant: {variant}")
    print(f"Training images: {len(train_df)}")
    print(f"Test images: {len(test_df)}")
    print(f"Output folder: {out_dir}")
    print("Original source images were not modified.")


if __name__ == "__main__":
    main()
