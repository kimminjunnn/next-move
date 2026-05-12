from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


COCO_ANNOTATIONS_FILE = "_annotations.coco.json"
DEFAULT_SPLITS = ("train", "valid", "test")
DRAW_COLORS = {
    "hold": (70, 210, 80),
    "volume": (190, 90, 230),
}
UNKNOWN_COLOR = (80, 170, 255)


@dataclass(frozen=True)
class SplitSummary:
    name: str
    image_count: int
    annotation_count: int
    annotation_count_by_category: dict[str, int]
    annotation_path: Path


@dataclass(frozen=True)
class DatasetSummary:
    dataset_name: str
    dataset_path: Path
    splits: dict[str, SplitSummary]


def _load_coco(annotation_path: Path) -> dict[str, Any]:
    with annotation_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _category_names(coco: dict[str, Any]) -> dict[int, str]:
    names: dict[int, str] = {}
    for category in coco.get("categories", []):
        try:
            names[int(category["id"])] = str(category["name"])
        except (KeyError, TypeError, ValueError):
            continue
    return names


def _count_annotations_by_category(coco: dict[str, Any]) -> dict[str, int]:
    categories = _category_names(coco)
    counts: dict[str, int] = {}
    for annotation in coco.get("annotations", []):
        try:
            category_id = int(annotation["category_id"])
        except (KeyError, TypeError, ValueError):
            continue
        name = categories.get(category_id, f"category_{category_id}")
        counts[name] = counts.get(name, 0) + 1
    return counts


def build_dataset_summary(dataset_path: Path, splits: list[str]) -> DatasetSummary:
    split_summaries: dict[str, SplitSummary] = {}
    for split in splits:
        annotation_path = dataset_path / split / COCO_ANNOTATIONS_FILE
        if not annotation_path.exists():
            continue

        coco = _load_coco(annotation_path)
        split_summaries[split] = SplitSummary(
            name=split,
            image_count=len(coco.get("images", [])),
            annotation_count=len(coco.get("annotations", [])),
            annotation_count_by_category=_count_annotations_by_category(coco),
            annotation_path=annotation_path,
        )

    return DatasetSummary(
        dataset_name=dataset_path.name,
        dataset_path=dataset_path,
        splits=split_summaries,
    )


def default_output_dir(dataset_path: Path) -> Path:
    return dataset_path.parent / "inspections" / dataset_path.name / "overlays"


def _annotations_by_image(coco: dict[str, Any]) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {}
    for annotation in coco.get("annotations", []):
        try:
            image_id = int(annotation["image_id"])
        except (KeyError, TypeError, ValueError):
            continue
        grouped.setdefault(image_id, []).append(annotation)
    return grouped


def _polygon_arrays(segmentation: Any) -> list[np.ndarray]:
    if not isinstance(segmentation, list):
        return []

    polygons: list[np.ndarray] = []
    for polygon in segmentation:
        if not isinstance(polygon, list) or len(polygon) < 6:
            continue
        try:
            points = np.array(polygon, dtype=np.float32).reshape(-1, 2)
        except ValueError:
            continue
        polygons.append(np.rint(points).astype(np.int32))
    return polygons


def _draw_annotation(
    overlay: np.ndarray,
    annotation: dict[str, Any],
    categories: dict[int, str],
) -> None:
    try:
        category_name = categories[int(annotation["category_id"])]
    except (KeyError, TypeError, ValueError):
        category_name = "unknown"

    color = DRAW_COLORS.get(category_name, UNKNOWN_COLOR)
    for polygon in _polygon_arrays(annotation.get("segmentation")):
        cv2.polylines(overlay, [polygon], isClosed=True, color=color, thickness=2)
        cv2.fillPoly(overlay, [polygon], color)


def _sample_images(coco: dict[str, Any], sample_count: int, seed: int) -> list[dict[str, Any]]:
    images = [image for image in coco.get("images", []) if isinstance(image, dict)]
    if sample_count >= len(images):
        return images

    randomizer = random.Random(seed)
    return randomizer.sample(images, sample_count)


def write_overlay_sample(split_dir: Path, output_dir: Path, sample_index: int = 0) -> Path:
    annotation_path = split_dir / COCO_ANNOTATIONS_FILE
    coco = _load_coco(annotation_path)
    images = [image for image in coco.get("images", []) if isinstance(image, dict)]
    if not images:
        raise ValueError(f"no_images_found:{split_dir}")
    if sample_index < 0 or sample_index >= len(images):
        raise IndexError("sample_index out of range")

    image_info = images[sample_index]
    return _write_overlay_for_image(split_dir, output_dir, coco, image_info)


def _write_overlay_for_image(
    split_dir: Path,
    output_dir: Path,
    coco: dict[str, Any],
    image_info: dict[str, Any],
) -> Path:
    file_name = str(image_info["file_name"])
    image_id = int(image_info["id"])
    image = cv2.imread(str(split_dir / file_name))
    if image is None:
        raise ValueError(f"image_not_readable:{split_dir / file_name}")

    rendered = image.copy()
    categories = _category_names(coco)
    annotations = _annotations_by_image(coco).get(image_id, [])

    mask_layer = np.zeros_like(rendered)
    for annotation in annotations:
        _draw_annotation(mask_layer, annotation, categories)
    rendered = cv2.addWeighted(rendered, 1.0, mask_layer, 0.32, 0)

    for annotation in annotations:
        try:
            category_name = categories[int(annotation["category_id"])]
        except (KeyError, TypeError, ValueError):
            category_name = "unknown"
        color = DRAW_COLORS.get(category_name, UNKNOWN_COLOR)
        for polygon in _polygon_arrays(annotation.get("segmentation")):
            cv2.polylines(rendered, [polygon], isClosed=True, color=color, thickness=2)

    output_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file_name).stem
    output_path = output_dir / f"{split_dir.name}_{safe_name}_overlay.jpg"
    cv2.imwrite(str(output_path), rendered)
    return output_path


def write_overlay_samples(
    dataset_path: Path,
    output_dir: Path,
    splits: list[str],
    samples_per_split: int,
    seed: int,
) -> list[Path]:
    written: list[Path] = []
    for split in splits:
        split_dir = dataset_path / split
        annotation_path = split_dir / COCO_ANNOTATIONS_FILE
        if not annotation_path.exists():
            continue

        coco = _load_coco(annotation_path)
        for image_info in _sample_images(coco, samples_per_split, seed):
            written.append(_write_overlay_for_image(split_dir, output_dir, coco, image_info))
    return written


def _parse_splits(value: str) -> list[str]:
    if value == "all":
        return list(DEFAULT_SPLITS)
    return [split.strip() for split in value.split(",") if split.strip()]


def _print_summary(summary: DatasetSummary) -> None:
    print(f"Dataset: {summary.dataset_name}")
    print(f"Path: {summary.dataset_path}")
    for split_name in DEFAULT_SPLITS:
        split = summary.splits.get(split_name)
        if split is None:
            continue
        print(f"\n[{split.name}]")
        print(f"images: {split.image_count}")
        print(f"annotations: {split.annotation_count}")
        for category, count in sorted(split.annotation_count_by_category.items()):
            print(f"{category}: {count}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect a Rupa segmentation dataset and render COCO polygon overlays.",
    )
    parser.add_argument("--dataset", required=True, type=Path, help="Dataset root path.")
    parser.add_argument(
        "--output",
        type=Path,
        help="Overlay output directory. Defaults to ../inspections/<dataset>/overlays.",
    )
    parser.add_argument(
        "--split",
        default="all",
        help="Split to inspect: all, train, valid, test, or comma-separated values.",
    )
    parser.add_argument("--samples", default=6, type=int, help="Samples to render per split.")
    parser.add_argument("--seed", default=7, type=int, help="Random sample seed.")
    args = parser.parse_args()

    dataset_path = args.dataset.expanduser().resolve()
    splits = _parse_splits(args.split)
    output_dir = args.output.expanduser().resolve() if args.output else default_output_dir(dataset_path)

    summary = build_dataset_summary(dataset_path, splits)
    _print_summary(summary)
    written = write_overlay_samples(
        dataset_path=dataset_path,
        output_dir=output_dir,
        splits=splits,
        samples_per_split=args.samples,
        seed=args.seed,
    )
    print(f"\nWrote {len(written)} overlay images to {output_dir}")


if __name__ == "__main__":
    main()
