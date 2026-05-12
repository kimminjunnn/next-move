from __future__ import annotations

import base64
import copy
import json
import os
import ssl
from typing import Any, Literal
from urllib import parse, request

import cv2
import numpy as np

from app.detection_utils import (
    ALLOWED_CLASSES,
    DEFAULT_CONFIDENCE_THRESHOLD,
    WallDetectionInferenceError,
    assign_parent_volumes,
    bbox_from_points,
    center_from_points,
    load_detection_env,
    mean_color,
    required_env,
)
from app.schemas import AnalyzeWallResponse, DetectedWallObject, ImageMeta, Point

DEFAULT_API_URL = "https://detect.roboflow.com"
MAX_ROBOFLOW_IMAGE_SIDE = 1600


def _prediction_class(prediction: dict[str, Any]) -> Literal["hold", "volume"] | None:
    raw_class = prediction.get("class") or prediction.get("class_name")
    if raw_class not in ALLOWED_CLASSES:
        return None
    return raw_class


def _prediction_confidence(prediction: dict[str, Any]) -> float:
    try:
        return float(prediction.get("confidence", 0))
    except (TypeError, ValueError):
        return 0.0


def _resize_image_for_roboflow(
    image: np.ndarray,
    max_side: int = MAX_ROBOFLOW_IMAGE_SIDE,
) -> tuple[np.ndarray, float, float]:
    height, width = image.shape[:2]
    longest_side = max(width, height)

    if longest_side <= max_side:
        return image, 1.0, 1.0

    resize_scale = max_side / longest_side
    resized_width = max(1, int(round(width * resize_scale)))
    resized_height = max(1, int(round(height * resize_scale)))
    resized = cv2.resize(
        image,
        (resized_width, resized_height),
        interpolation=cv2.INTER_AREA,
    )
    return resized, width / resized_width, height / resized_height


def _scale_number(value: Any, scale: float) -> Any:
    try:
        return int(round(float(value) * scale))
    except (TypeError, ValueError):
        return value


def _scale_roboflow_payload(
    payload: dict[str, Any],
    scale_x: float,
    scale_y: float,
) -> dict[str, Any]:
    if scale_x == 1.0 and scale_y == 1.0:
        return payload

    scaled_payload = copy.deepcopy(payload)
    predictions = scaled_payload.get("predictions")
    if not isinstance(predictions, list):
        return scaled_payload

    for prediction in predictions:
        if not isinstance(prediction, dict):
            continue

        for key in ("x", "width"):
            if key in prediction:
                prediction[key] = _scale_number(prediction[key], scale_x)
        for key in ("y", "height"):
            if key in prediction:
                prediction[key] = _scale_number(prediction[key], scale_y)

        points = prediction.get("points")
        if not isinstance(points, list):
            continue

        for point in points:
            if not isinstance(point, dict):
                continue
            if "x" in point:
                point["x"] = _scale_number(point["x"], scale_x)
            if "y" in point:
                point["y"] = _scale_number(point["y"], scale_y)

    return scaled_payload


def _points_from_prediction(prediction: dict[str, Any]) -> list[Point]:
    raw_points = prediction.get("points")
    points: list[Point] = []

    if isinstance(raw_points, list):
        for raw_point in raw_points:
            if not isinstance(raw_point, dict):
                continue
            try:
                points.append(
                    Point(
                        x=int(round(float(raw_point["x"]))),
                        y=int(round(float(raw_point["y"]))),
                    )
                )
            except (KeyError, TypeError, ValueError):
                continue

    if len(points) >= 3:
        return points

    x = float(prediction.get("x", 0))
    y = float(prediction.get("y", 0))
    width = float(prediction.get("width", 0))
    height = float(prediction.get("height", 0))
    left = int(round(x - width / 2))
    top = int(round(y - height / 2))
    right = int(round(x + width / 2))
    bottom = int(round(y + height / 2))
    return [
        Point(x=left, y=top),
        Point(x=right, y=top),
        Point(x=right, y=bottom),
        Point(x=left, y=bottom),
    ]


def roboflow_predictions_to_response(
    image: np.ndarray,
    payload: dict[str, Any],
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> AnalyzeWallResponse:
    image_height, image_width = image.shape[:2]
    by_kind: dict[str, list[DetectedWallObject]] = {"hold": [], "volume": []}

    for prediction in payload.get("predictions", []):
        if not isinstance(prediction, dict):
            continue

        kind = _prediction_class(prediction)
        if kind is None or _prediction_confidence(prediction) < confidence_threshold:
            continue

        contour = _points_from_prediction(prediction)
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


def infer_wall_objects_with_roboflow(
    image: np.ndarray,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> AnalyzeWallResponse:
    load_detection_env()
    api_key = required_env("ROBOFLOW_API_KEY")
    model_id = required_env("ROBOFLOW_MODEL_ID")
    api_url = os.environ.get("ROBOFLOW_API_URL", DEFAULT_API_URL).rstrip("/")
    request_image, scale_x, scale_y = _resize_image_for_roboflow(image)

    ok, encoded = cv2.imencode(".jpg", request_image)
    if not ok:
        raise WallDetectionInferenceError("image_encode_failed")

    body = base64.b64encode(encoded.tobytes())
    url = f"{api_url}/{model_id}?{parse.urlencode({'api_key': api_key})}"
    http_request = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        context = _ssl_context()
        with request.urlopen(http_request, timeout=45, context=context) as response:
            response_body = response.read().decode("utf-8")
    except Exception as error:
        raise WallDetectionInferenceError("roboflow_request_failed") from error

    try:
        payload = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise WallDetectionInferenceError("roboflow_response_invalid") from error

    payload = _scale_roboflow_payload(payload, scale_x, scale_y)
    return roboflow_predictions_to_response(
        image=image,
        payload=payload,
        confidence_threshold=confidence_threshold,
    )


def _ssl_context() -> ssl.SSLContext | None:
    try:
        import certifi
    except ImportError:
        return None

    return ssl.create_default_context(cafile=certifi.where())
