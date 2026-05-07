from __future__ import annotations

from pathlib import Path
import urllib.request

import cv2
import numpy as np
import pillow_heif

from app.schemas import AnalyzeWallRequest


def _decode_heif_payload(payload: bytes) -> np.ndarray:
    heif_image = pillow_heif.read_heif(payload)
    rgb_image = np.asarray(heif_image, dtype=np.uint8)

    if rgb_image.ndim == 2:
        return cv2.cvtColor(rgb_image, cv2.COLOR_GRAY2BGR)

    if rgb_image.shape[2] == 4:
        return cv2.cvtColor(rgb_image, cv2.COLOR_RGBA2BGR)

    return cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)


def _is_heif_path(path: str) -> bool:
    return Path(path).suffix.lower() in {".heic", ".heif"}


def _decode_image_payload(payload: bytes, *, is_heif: bool) -> np.ndarray | None:
    if is_heif:
        return _decode_heif_payload(payload)

    return cv2.imdecode(
        np.frombuffer(payload, dtype=np.uint8),
        cv2.IMREAD_COLOR,
    )


def load_image(request: AnalyzeWallRequest) -> np.ndarray:
    if request.imagePath:
        image = cv2.imread(request.imagePath, cv2.IMREAD_COLOR)
        if image is None and _is_heif_path(request.imagePath):
            image = _decode_heif_payload(Path(request.imagePath).read_bytes())
        if image is None:
            raise ValueError("image_not_readable:path")
        return image

    if request.imageUrl:
        with urllib.request.urlopen(request.imageUrl, timeout=10) as response:
            payload = response.read()

        decoded = _decode_image_payload(
            payload,
            is_heif=_is_heif_path(request.imageUrl),
        )
        if decoded is None:
            raise ValueError("image_not_readable:url")
        return decoded

    raise ValueError("image_source_missing")
