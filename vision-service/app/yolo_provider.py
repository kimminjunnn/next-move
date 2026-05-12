from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Literal

import numpy as np
import cv2

from app.detection_utils import (
    ALLOWED_CLASSES,
    DEFAULT_CONFIDENCE_THRESHOLD,
    WallDetectionConfigError,
    WallDetectionInferenceError,
    assign_parent_volumes,
    bbox_from_points,
    center_from_points,
    load_detection_env,
    mean_color,
)
from app.schemas import AnalyzeWallResponse, DetectedWallObject, ImageMeta, Point

MODEL_PATH_ENV = "RUPA_WALL_MODEL_PATH"


def _point_from_xy(x: float, y: float, width: int, height: int) -> Point:
    return Point(
        x=max(0, min(width - 1, int(round(float(x))))),
        y=max(0, min(height - 1, int(round(float(y))))),
    )


def _class_name(names: Any, class_index: int) -> Literal["hold", "volume"] | None:
    if isinstance(names, dict):
        raw_name = names.get(class_index)
    elif isinstance(names, list) and 0 <= class_index < len(names):
        raw_name = names[class_index]
    else:
        raw_name = None

    if raw_name not in ALLOWED_CLASSES:
        return None
    return raw_name


def _to_numpy(values: Any) -> np.ndarray:
    if hasattr(values, "detach"):
        values = values.detach()
    if hasattr(values, "cpu"):
        values = values.cpu()
    if hasattr(values, "numpy"):
        values = values.numpy()
    return np.asarray(values)


def _distance_to_segment(point: np.ndarray, start: np.ndarray, end: np.ndarray) -> float:
    segment = end - start
    length_squared = float(np.dot(segment, segment))
    if length_squared == 0:
        return float(np.linalg.norm(point - start))

    t = max(0.0, min(1.0, float(np.dot(point - start, segment) / length_squared)))
    projection = start + t * segment
    return float(np.linalg.norm(point - projection))


def _remove_narrow_spike_vertices(points: np.ndarray) -> np.ndarray:
    if len(points) < 5:
        return points

    kept: list[np.ndarray] = []
    count = len(points)
    for index, point in enumerate(points):
        previous_point = points[(index - 1) % count]
        next_point = points[(index + 1) % count]
        base_width = float(np.linalg.norm(next_point - previous_point))
        spike_height = _distance_to_segment(point, previous_point, next_point)
        if base_width <= 8.0 and spike_height >= 8.0:
            continue
        kept.append(point)

    if len(kept) < 3:
        return points
    return np.asarray(kept, dtype=np.int32)


def _clean_contour_points(
    polygon: np.ndarray,
    width: int,
    height: int,
) -> list[Point]:
    raw_points = np.asarray(polygon)
    if len(raw_points) < 3:
        return []

    contour = np.array(
        [
            [
                max(0, min(width - 1, int(round(float(point[0]))))),
                max(0, min(height - 1, int(round(float(point[1]))))),
            ]
            for point in raw_points
        ],
        dtype=np.int32,
    )
    contour = _remove_narrow_spike_vertices(contour)

    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(mask, [contour], 255)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return [_point_from_xy(point[0], point[1], width=width, height=height) for point in raw_points]

    largest_contour = max(contours, key=cv2.contourArea)
    if len(largest_contour) < 3:
        return [_point_from_xy(point[0], point[1], width=width, height=height) for point in raw_points]

    perimeter = cv2.arcLength(largest_contour, True)
    epsilon = max(1.0, perimeter * 0.003)
    simplified = cv2.approxPolyDP(largest_contour, epsilon, True).reshape(-1, 2)
    if len(simplified) < 3:
        simplified = largest_contour.reshape(-1, 2)

    return [
        _point_from_xy(point[0], point[1], width=width, height=height)
        for point in simplified
    ]


def _model_path_from_env() -> Path:
    load_detection_env()
    raw_path = os.environ.get(MODEL_PATH_ENV)
    if not raw_path:
        raise WallDetectionConfigError("rupa_wall_model_path_missing")

    path = Path(raw_path).expanduser()
    if not path.exists():
        raise WallDetectionConfigError("rupa_wall_model_missing")
    return path


@lru_cache(maxsize=1)
def _load_yolo_model(model_path: str):
    try:
        from ultralytics import YOLO
    except ImportError as error:
        raise WallDetectionConfigError("ultralytics_missing") from error

    return YOLO(model_path)


def yolo_results_to_response(
    image: np.ndarray,
    results: Iterable[Any],
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> AnalyzeWallResponse:
    image_height, image_width = image.shape[:2]
    by_kind: dict[str, list[DetectedWallObject]] = {"hold": [], "volume": []}

    for result in results:
        boxes = getattr(result, "boxes", None)
        masks = getattr(result, "masks", None)
        if boxes is None or masks is None:
            continue

        classes = _to_numpy(getattr(boxes, "cls", []))
        confidences = _to_numpy(getattr(boxes, "conf", []))
        polygons = list(getattr(masks, "xy", []) or [])

        for index, polygon in enumerate(polygons):
            if index >= len(classes) or index >= len(confidences):
                continue
            if float(confidences[index]) < confidence_threshold:
                continue

            kind = _class_name(getattr(result, "names", None), int(classes[index]))
            if kind is None:
                continue

            raw_points = np.asarray(polygon)
            if len(raw_points) < 3:
                continue

            contour = _clean_contour_points(raw_points, width=image_width, height=image_height)
            if len(contour) < 3:
                continue
            bbox = bbox_from_points(contour)
            center = center_from_points(contour, bbox)
            next_index = len(by_kind[kind]) + 1
            by_kind[kind].append(
                DetectedWallObject(
                    id=f"obj_{kind}_{next_index:02d}",
                    kind=kind,
                    bbox=bbox,
                    center=center,
                    contour=contour,
                    color=mean_color(image, contour),
                    parentVolumeObjectId=None,
                )
            )

    assign_parent_volumes(by_kind["hold"], by_kind["volume"])
    objects = sorted(
        [*by_kind["hold"], *by_kind["volume"]],
        key=lambda obj: (0 if obj.kind == "hold" else 1, obj.bbox.y, obj.bbox.x),
    )
    return AnalyzeWallResponse(
        image=ImageMeta(width=image_width, height=image_height),
        objects=objects,
    )


def infer_wall_objects_with_yolo(
    image: np.ndarray,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> AnalyzeWallResponse:
    model_path = _model_path_from_env()
    model = _load_yolo_model(str(model_path))

    try:
        results = model.predict(
            image,
            imgsz=960,
            conf=confidence_threshold,
            retina_masks=True,
            verbose=False,
        )
    except Exception as error:
        raise WallDetectionInferenceError("yolo_inference_failed") from error

    return yolo_results_to_response(
        image=image,
        results=results,
        confidence_threshold=confidence_threshold,
    )
