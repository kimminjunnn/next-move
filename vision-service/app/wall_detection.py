from __future__ import annotations

import os
from typing import Literal

import numpy as np

from app.detection_utils import (
    DEFAULT_CONFIDENCE_THRESHOLD,
    WallDetectionConfigError,
    WallDetectionInferenceError,
    load_detection_env,
)
from app.roboflow_provider import infer_wall_objects_with_roboflow
from app.schemas import AnalyzeWallResponse
from app.yolo_provider import infer_wall_objects_with_yolo

PROVIDER_ENV = "RUPA_WALL_DETECTION_PROVIDER"
DEFAULT_PROVIDER = "yolo"
WallDetectionProvider = Literal["yolo", "roboflow"]


def selected_wall_detection_provider() -> WallDetectionProvider:
    load_detection_env()
    raw_provider = os.environ.get(PROVIDER_ENV, DEFAULT_PROVIDER).strip().lower()
    if raw_provider in {"yolo", "local_yolo", "local-yolo"}:
        return "yolo"
    if raw_provider == "roboflow":
        return "roboflow"
    raise WallDetectionConfigError("wall_detection_provider_invalid")


def infer_wall_objects(
    image: np.ndarray,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> AnalyzeWallResponse:
    provider = selected_wall_detection_provider()
    if provider == "roboflow":
        return infer_wall_objects_with_roboflow(
            image=image,
            confidence_threshold=confidence_threshold,
        )
    return infer_wall_objects_with_yolo(
        image=image,
        confidence_threshold=confidence_threshold,
    )
