from __future__ import annotations

import base64
import copy
import json
import os
import ssl
from pathlib import Path
from typing import Any, Literal
from urllib import parse, request

import cv2
import numpy as np

from app.schemas import (
    AnalyzeWallResponse,
    BBox,
    Color,
    DetectedWallObject,
    ImageMeta,
    Point,
)

ALLOWED_CLASSES = {"hold", "volume"}
DEFAULT_CONFIDENCE_THRESHOLD = 0.35
DEFAULT_API_URL = "https://detect.roboflow.com"
MAX_ROBOFLOW_IMAGE_SIDE = 1600


class RoboflowConfigError(RuntimeError):
    pass


class RoboflowRequestError(RuntimeError):
    pass


def load_roboflow_env(env_path: Path | None = None) -> None:
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


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RoboflowConfigError(f"{name.lower()}_missing")
    return value


def _component_to_hex(value: float) -> str:
    return hex(max(0, min(255, int(round(value)))))[2:].zfill(2)


def _bgr_to_hex(blue: float, green: float, red: float) -> str:
    return f"#{_component_to_hex(red)}{_component_to_hex(green)}{_component_to_hex(blue)}"


def _representative_bgr(pixels: np.ndarray) -> tuple[float, float, float]:
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


def _bbox_from_points(points: list[Point]) -> BBox:
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


def _center_from_points(points: list[Point], bbox: BBox) -> Point:
    contour = np.array([[point.x, point.y] for point in points], dtype=np.int32)
    moments = cv2.moments(contour)
    if moments["m00"] == 0:
        return Point(x=bbox.x + bbox.width // 2, y=bbox.y + bbox.height // 2)
    return Point(
        x=int(round(moments["m10"] / moments["m00"])),
        y=int(round(moments["m01"] / moments["m00"])),
    )


def _mean_color(image: np.ndarray, points: list[Point]) -> Color:
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
    blue, green, red = _representative_bgr(image[mask > 0])
    return Color(hex=_bgr_to_hex(blue, green, red))


def _bbox_iou(box_a: BBox, box_b: BBox) -> float:
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


def _assign_parent_volumes(
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
            volume.id for volume in volumes if _bbox_iou(hold.bbox, volume.bbox) > 0.12
        ]
        if overlapping_volume_ids:
            hold.parentVolumeObjectId = sorted(overlapping_volume_ids)[0]


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
        bbox = _bbox_from_points(contour)
        center = _center_from_points(contour, bbox)
        next_index = len(by_kind[kind]) + 1
        by_kind[kind].append(
            DetectedWallObject(
                id=f"obj_{kind}_{next_index:02d}",
                kind=kind,
                bbox=bbox,
                center=center,
                contour=contour,
                color=_mean_color(image, contour),
                parentVolumeObjectId=None,
            )
        )

    _assign_parent_volumes(by_kind["hold"], by_kind["volume"])
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
    load_roboflow_env()
    api_key = _required_env("ROBOFLOW_API_KEY")
    model_id = _required_env("ROBOFLOW_MODEL_ID")
    api_url = os.environ.get("ROBOFLOW_API_URL", DEFAULT_API_URL).rstrip("/")
    request_image, scale_x, scale_y = _resize_image_for_roboflow(image)

    ok, encoded = cv2.imencode(".jpg", request_image)
    if not ok:
        raise RoboflowRequestError("image_encode_failed")

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
        raise RoboflowRequestError("roboflow_request_failed") from error

    try:
        payload = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise RoboflowRequestError("roboflow_response_invalid") from error

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
