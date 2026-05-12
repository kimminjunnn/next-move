from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np

from app.schemas import BBox, Color, DetectedWallObject, Point

ALLOWED_CLASSES = {"hold", "volume"}
DEFAULT_CONFIDENCE_THRESHOLD = 0.5


class WallDetectionConfigError(RuntimeError):
    pass


class WallDetectionInferenceError(RuntimeError):
    pass


def load_detection_env(env_path: Path | None = None) -> None:
    path = env_path or Path(__file__).resolve().parent.parent / ".env"
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise WallDetectionConfigError(f"{name.lower()}_missing")
    return value


def _component_to_hex(value: float) -> str:
    return hex(max(0, min(255, int(round(value)))))[2:].zfill(2)


def _bgr_to_hex(blue: float, green: float, red: float) -> str:
    return f"#{_component_to_hex(red)}{_component_to_hex(green)}{_component_to_hex(blue)}"


def representative_bgr(pixels: np.ndarray) -> tuple[float, float, float]:
    if len(pixels) == 0:
        return 0, 0, 0

    hsv = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)
    saturation = hsv[:, 1]
    value = hsv[:, 2]
    colored_pixels = (saturation >= 50) & (value >= 45)

    if np.count_nonzero(colored_pixels) >= max(24, int(len(pixels) * 0.18)):
        chalk_pixels = (saturation <= 55) & (value >= 165)
        usable_pixels = colored_pixels & ~chalk_pixels
        if np.count_nonzero(usable_pixels) >= 12:
            pixels = pixels[usable_pixels]

    blue, green, red = np.median(pixels, axis=0)
    return float(blue), float(green), float(red)


def bbox_from_points(points: list[Point]) -> BBox:
    min_x = min(point.x for point in points)
    min_y = min(point.y for point in points)
    max_x = max(point.x for point in points)
    max_y = max(point.y for point in points)
    return BBox(
        x=min_x,
        y=min_y,
        width=max(1, max_x - min_x),
        height=max(1, max_y - min_y),
    )


def center_from_points(points: list[Point], bbox: BBox) -> Point:
    contour = np.array([[point.x, point.y] for point in points], dtype=np.int32)
    moments = cv2.moments(contour)
    if moments["m00"] == 0:
        return Point(x=bbox.x + bbox.width // 2, y=bbox.y + bbox.height // 2)
    return Point(
        x=int(round(moments["m10"] / moments["m00"])),
        y=int(round(moments["m01"] / moments["m00"])),
    )


def mean_color(image: np.ndarray, points: list[Point]) -> Color:
    height, width = image.shape[:2]
    contour = np.array(
        [
            [
                max(0, min(width - 1, point.x)),
                max(0, min(height - 1, point.y)),
            ]
            for point in points
        ],
        dtype=np.int32,
    )
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(mask, [contour], 255)
    if cv2.countNonZero(mask) == 0:
        return Color(hex="#000000")
    blue, green, red = representative_bgr(image[mask > 0])
    return Color(hex=_bgr_to_hex(blue, green, red))


def bbox_iou(box_a: BBox, box_b: BBox) -> float:
    x1 = max(box_a.x, box_b.x)
    y1 = max(box_a.y, box_b.y)
    x2 = min(box_a.x + box_a.width, box_b.x + box_b.width)
    y2 = min(box_a.y + box_a.height, box_b.y + box_b.height)
    if x2 <= x1 or y2 <= y1:
        return 0.0

    intersection = (x2 - x1) * (y2 - y1)
    area_a = box_a.width * box_a.height
    area_b = box_b.width * box_b.height
    union = area_a + area_b - intersection
    return intersection / union if union > 0 else 0.0


def assign_parent_volumes(
    holds: list[DetectedWallObject],
    volumes: list[DetectedWallObject],
) -> None:
    volume_contours = {
        obj.id: np.array([[point.x, point.y] for point in obj.contour], dtype=np.int32)
        for obj in volumes
    }

    for hold in holds:
        containing_volume_ids = [
            volume_id
            for volume_id, contour in volume_contours.items()
            if cv2.pointPolygonTest(
                contour.astype(np.float32),
                (float(hold.center.x), float(hold.center.y)),
                False,
            )
            >= 0
        ]
        if containing_volume_ids:
            hold.parentVolumeObjectId = sorted(containing_volume_ids)[0]
            continue

        overlapping_volume_ids = [
            volume.id for volume in volumes if bbox_iou(hold.bbox, volume.bbox) > 0.12
        ]
        if overlapping_volume_ids:
            hold.parentVolumeObjectId = sorted(overlapping_volume_ids)[0]
