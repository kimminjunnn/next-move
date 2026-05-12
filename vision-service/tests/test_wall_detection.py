import os
import unittest
from unittest.mock import patch

import numpy as np

from app.detection_utils import WallDetectionConfigError
from app.wall_detection import infer_wall_objects, selected_wall_detection_provider


class WallDetectionTests(unittest.TestCase):
    def setUp(self):
        self._previous_provider = os.environ.get("RUPA_WALL_DETECTION_PROVIDER")

    def tearDown(self):
        if self._previous_provider is None:
            os.environ.pop("RUPA_WALL_DETECTION_PROVIDER", None)
        else:
            os.environ["RUPA_WALL_DETECTION_PROVIDER"] = self._previous_provider

    def test_defaults_to_yolo_provider(self):
        os.environ.pop("RUPA_WALL_DETECTION_PROVIDER", None)

        self.assertEqual(selected_wall_detection_provider(), "yolo")

    def test_allows_roboflow_provider_for_fallback(self):
        os.environ["RUPA_WALL_DETECTION_PROVIDER"] = "roboflow"

        self.assertEqual(selected_wall_detection_provider(), "roboflow")

    def test_rejects_unknown_provider(self):
        os.environ["RUPA_WALL_DETECTION_PROVIDER"] = "unknown"

        with self.assertRaisesRegex(WallDetectionConfigError, "wall_detection_provider_invalid"):
            selected_wall_detection_provider()

    def test_dispatches_to_selected_provider(self):
        image = np.zeros((10, 10, 3), dtype=np.uint8)
        os.environ["RUPA_WALL_DETECTION_PROVIDER"] = "roboflow"

        with patch("app.wall_detection.infer_wall_objects_with_roboflow") as roboflow:
            roboflow.return_value = "roboflow-result"

            result = infer_wall_objects(image)

        self.assertEqual(result, "roboflow-result")
        roboflow.assert_called_once()


if __name__ == "__main__":
    unittest.main()
