from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any


COCO_ANNOTATIONS_FILE = "_annotations.coco.json"
DEFAULT_SPLITS = ("train", "valid", "test")
RUPA_CLASS_TO_YOLO_ID = {
    "hold": 0,
    "volume": 1,
}


@dataclass(frozen=True)
class ConvertedSplitSummary:
    split: str
    output_split: str
    image_count: int
    label_file_count: int
    label_count: int


def yolo_output_split(split: str) -> str:
    return "val" if split == "valid" else split


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


def _annotations_by_image(coco: dict[str, Any]) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {}
    for annotation in coco.get("annotations", []):
        try:
            image_id = int(annotation["image_id"])
        except (KeyError, TypeError, ValueError):
            continue
        grouped.setdefault(image_id, []).append(annotation)
    return grouped


def _normalized_polygon_tokens(
    polygon: list[Any],
    width: float,
    height: float,
) -> list[str] | None:
    if len(polygon) < 6 or len(polygon) % 2 != 0 or width <= 0 or height <= 0:
        return None

    tokens: list[str] = []
    for index in range(0, len(polygon), 2):
        try:
            x = float(polygon[index]) / width
            y = float(polygon[index + 1]) / height
        except (TypeError, ValueError):
            return None
        x = min(1.0, max(0.0, x))
        y = min(1.0, max(0.0, y))
        tokens.append(f"{x:.6f}")
        tokens.append(f"{y:.6f}")
    return tokens


def _yolo_lines_for_annotation(
    annotation: dict[str, Any],
    categories: dict[int, str],
    width: float,
    height: float,
) -> list[str]:
    try:
        category_name = categories[int(annotation["category_id"])]
    except (KeyError, TypeError, ValueError):
        return []

    yolo_class_id = RUPA_CLASS_TO_YOLO_ID.get(category_name)
    if yolo_class_id is None:
        return []

    segmentation = annotation.get("segmentation")
    if not isinstance(segmentation, list):
        return []

    lines: list[str] = []
    for polygon in segmentation:
        if not isinstance(polygon, list):
            continue
        tokens = _normalized_polygon_tokens(polygon, width, height)
        if tokens is None:
            continue
        lines.append(" ".join([str(yolo_class_id), *tokens]))
    return lines


def _image_entries(coco: dict[str, Any]) -> list[dict[str, Any]]:
    return [image for image in coco.get("images", []) if isinstance(image, dict)]


def convert_coco_split_to_yolo(
    dataset_path: Path,
    output_path: Path,
    split: str,
) -> ConvertedSplitSummary:
    source_split_dir = dataset_path / split
    annotation_path = source_split_dir / COCO_ANNOTATIONS_FILE
    coco = _load_coco(annotation_path)
    categories = _category_names(coco)
    annotations_by_image = _annotations_by_image(coco)

    output_split = yolo_output_split(split)
    image_output_dir = output_path / "images" / output_split
    label_output_dir = output_path / "labels" / output_split
    image_output_dir.mkdir(parents=True, exist_ok=True)
    label_output_dir.mkdir(parents=True, exist_ok=True)

    image_count = 0
    label_file_count = 0
    label_count = 0

    for image in _image_entries(coco):
        try:
            file_name = str(image["file_name"])
            image_id = int(image["id"])
            width = float(image["width"])
            height = float(image["height"])
        except (KeyError, TypeError, ValueError):
            continue

        source_image = source_split_dir / file_name
        if not source_image.exists():
            continue

        shutil.copy2(source_image, image_output_dir / file_name)
        image_count += 1

        lines: list[str] = []
        for annotation in annotations_by_image.get(image_id, []):
            lines.extend(_yolo_lines_for_annotation(annotation, categories, width, height))

        label_path = label_output_dir / f"{Path(file_name).stem}.txt"
        label_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
        label_file_count += 1
        label_count += len(lines)

    return ConvertedSplitSummary(
        split=split,
        output_split=output_split,
        image_count=image_count,
        label_file_count=label_file_count,
        label_count=label_count,
    )


def _write_data_yaml(output_path: Path, converted_splits: list[str]) -> None:
    lines = [
        f"path: {output_path.resolve()}",
        "train: images/train",
    ]
    if "valid" in converted_splits:
        lines.append("val: images/val")
    if "test" in converted_splits:
        lines.append("test: images/test")
    lines.extend(
        [
            "nc: 2",
            "names: [hold, volume]",
        ]
    )
    (output_path / "data.yaml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def convert_rupa_coco_to_yolo(
    dataset_path: Path,
    output_path: Path,
    splits: list[str],
) -> dict[str, ConvertedSplitSummary]:
    output_path.mkdir(parents=True, exist_ok=True)

    summaries: dict[str, ConvertedSplitSummary] = {}
    converted_splits: list[str] = []
    for split in splits:
        annotation_path = dataset_path / split / COCO_ANNOTATIONS_FILE
        if not annotation_path.exists():
            continue
        summaries[split] = convert_coco_split_to_yolo(dataset_path, output_path, split)
        converted_splits.append(split)

    _write_data_yaml(output_path, converted_splits)
    return summaries


def _parse_splits(value: str) -> list[str]:
    if value == "all":
        return list(DEFAULT_SPLITS)
    return [split.strip() for split in value.split(",") if split.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a Rupa COCO segmentation dataset to YOLO segmentation format.",
    )
    parser.add_argument("--dataset", required=True, type=Path, help="COCO dataset root path.")
    parser.add_argument("--output", required=True, type=Path, help="YOLO output dataset path.")
    parser.add_argument(
        "--split",
        default="all",
        help="Split to convert: all, train, valid, test, or comma-separated values.",
    )
    args = parser.parse_args()

    dataset_path = args.dataset.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    summaries = convert_rupa_coco_to_yolo(dataset_path, output_path, _parse_splits(args.split))

    print(f"Converted dataset: {dataset_path}")
    print(f"Output: {output_path}")
    for split in DEFAULT_SPLITS:
        summary = summaries.get(split)
        if summary is None:
            continue
        print(
            f"{split} -> {summary.output_split}: "
            f"{summary.image_count} images, "
            f"{summary.label_file_count} label files, "
            f"{summary.label_count} labels"
        )


if __name__ == "__main__":
    main()
