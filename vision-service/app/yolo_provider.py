from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Literal

import numpy as np

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

            contour = [
                _point_from_xy(point[0], point[1], width=image_width, height=image_height)
                for point in raw_points
            ]
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
