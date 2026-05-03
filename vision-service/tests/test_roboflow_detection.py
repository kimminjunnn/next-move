import unittest

import numpy as np

from app.roboflow_detection import roboflow_predictions_to_response


class RoboflowDetectionTests(unittest.TestCase):
    def test_converts_hold_and_volume_predictions_to_wall_objects(self):
        image = np.zeros((120, 160, 3), dtype=np.uint8)
        image[:] = (10, 20, 30)
        payload = {
            "predictions": [
                {
                    "class": "hold",
                    "confidence": 0.91,
                    "x": 35,
                    "y": 20,
                    "width": 30,
                    "height": 20,
                    "points": [
                        {"x": 20, "y": 10},
                        {"x": 50, "y": 10},
                        {"x": 50, "y": 30},
                        {"x": 20, "y": 30},
                    ],
                },
                {
                    "class": "volume",
                    "confidence": 0.88,
                    "x": 100,
                    "y": 75,
                    "width": 60,
                    "height": 40,
                    "points": [
                        {"x": 70, "y": 55},
                        {"x": 130, "y": 55},
                        {"x": 130, "y": 95},
                        {"x": 70, "y": 95},
                    ],
                },
            ]
        }

        result = roboflow_predictions_to_response(
            image=image,
            payload=payload,
            confidence_threshold=0.5,
        )

        self.assertEqual(result.image.width, 160)
        self.assertEqual(result.image.height, 120)
        self.assertEqual([obj.kind for obj in result.objects], ["hold", "volume"])
        self.assertEqual(result.objects[0].id, "obj_hold_01")
        self.assertEqual(result.objects[0].bbox.model_dump(), {"x": 20, "y": 10, "width": 30, "height": 20})
        self.assertEqual(result.objects[0].center.model_dump(), {"x": 35, "y": 20})
        self.assertEqual(result.objects[0].color.hex, "#1e140a")
        self.assertEqual(result.objects[1].id, "obj_volume_01")

    def test_filters_low_confidence_and_unknown_classes(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        payload = {
            "predictions": [
                {"class": "hold", "confidence": 0.24, "x": 20, "y": 20, "width": 10, "height": 10},
                {"class": "person", "confidence": 0.99, "x": 40, "y": 40, "width": 10, "height": 10},
                {"class": "volume", "confidence": 0.72, "x": 50, "y": 50, "width": 20, "height": 20},
            ]
        }

        result = roboflow_predictions_to_response(
            image=image,
            payload=payload,
            confidence_threshold=0.5,
        )

        self.assertEqual(len(result.objects), 1)
        self.assertEqual(result.objects[0].kind, "volume")
        self.assertEqual(result.objects[0].bbox.model_dump(), {"x": 40, "y": 40, "width": 20, "height": 20})

    def test_ignores_chalk_when_estimating_hold_color(self):
        image = np.zeros((60, 60, 3), dtype=np.uint8)
        image[:] = (10, 10, 10)
        image[10:50, 10:50] = (20, 30, 210)
        image[10:26, 10:50] = (232, 232, 232)
        image[42:50, 10:50] = (7, 10, 72)
        payload = {
            "predictions": [
                {
                    "class": "hold",
                    "confidence": 0.91,
                    "points": [
                        {"x": 10, "y": 10},
                        {"x": 50, "y": 10},
                        {"x": 50, "y": 50},
                        {"x": 10, "y": 50},
                    ],
                }
            ]
        }

        result = roboflow_predictions_to_response(
            image=image,
            payload=payload,
            confidence_threshold=0.5,
        )

        self.assertEqual(result.objects[0].color.hex, "#d21e14")


if __name__ == "__main__":
    unittest.main()
