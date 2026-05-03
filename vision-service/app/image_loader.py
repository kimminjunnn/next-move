from __future__ import annotations

import urllib.request

import cv2
import numpy as np

from app.schemas import AnalyzeWallRequest


def load_image(request: AnalyzeWallRequest) -> np.ndarray:
    if request.imagePath:
        image = cv2.imread(request.imagePath, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("image_not_readable:path")
        return image

    if request.imageUrl:
        with urllib.request.urlopen(request.imageUrl, timeout=10) as response:
            payload = response.read()

        decoded = cv2.imdecode(
            np.frombuffer(payload, dtype=np.uint8),
            cv2.IMREAD_COLOR,
        )
        if decoded is None:
            raise ValueError("image_not_readable:url")
        return decoded

    raise ValueError("image_source_missing")
