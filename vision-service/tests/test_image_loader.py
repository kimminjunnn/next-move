import unittest
from unittest.mock import patch

import numpy as np

from app.image_loader import _decode_heif_payload


class _FakeHeifImage:
    def __array__(self, dtype=None):
        image = np.array([[[10, 20, 30], [40, 50, 60]]], dtype=np.uint8)
        if dtype is not None:
            return image.astype(dtype)
        return image


class ImageLoaderTests(unittest.TestCase):
    def test_decodes_heif_payload_to_opencv_bgr_image(self):
        with patch("app.image_loader.pillow_heif.read_heif", return_value=_FakeHeifImage()):
            image = _decode_heif_payload(b"heif-bytes")

        expected = np.array([[[30, 20, 10], [60, 50, 40]]], dtype=np.uint8)
        np.testing.assert_array_equal(image, expected)


if __name__ == "__main__":
    unittest.main()
