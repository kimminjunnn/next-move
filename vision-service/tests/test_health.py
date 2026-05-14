import os
import tempfile
import unittest
from unittest.mock import patch

from app.routes import health


class HealthTests(unittest.TestCase):
    def test_reports_model_path_status(self):
        with tempfile.NamedTemporaryFile() as model_file:
            with patch.dict(
                os.environ,
                {
                    "RUPA_WALL_DETECTION_PROVIDER": "yolo",
                    "RUPA_WALL_MODEL_PATH": model_file.name,
                },
                clear=False,
            ):
                response = health()

        self.assertEqual(
            response,
            {
                "ok": True,
                "service": "vision-service",
                "wallDetectionProvider": "yolo",
                "modelPathConfigured": True,
                "modelPathExists": True,
            },
        )

    def test_reports_missing_model_path_without_failing_health_route(self):
        with patch.dict(os.environ, {}, clear=True):
            response = health()

        self.assertEqual(response["ok"], True)
        self.assertEqual(response["service"], "vision-service")
        self.assertEqual(response["wallDetectionProvider"], "yolo")
        self.assertEqual(response["modelPathConfigured"], False)
        self.assertEqual(response["modelPathExists"], False)


if __name__ == "__main__":
    unittest.main()
