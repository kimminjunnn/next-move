import unittest
from types import SimpleNamespace

import numpy as np

from app.yolo_detection import yolo_results_to_response


class YoloDetectionTests(unittest.TestCase):
    def test_converts_yolo_segments_to_wall_objects(self):
        image = np.zeros((100, 120, 3), dtype=np.uint8)
        image[:] = (10, 20, 30)
        result = SimpleNamespace(
            names={0: "hold", 1: "volume"},
            boxes=SimpleNamespace(
                cls=np.array([0, 1], dtype=np.float32),
                conf=np.array([0.91, 0.88], dtype=np.float32),
            ),
            masks=SimpleNamespace(
                xy=[
                    np.array([[10, 10], [30, 10], [30, 30], [10, 30]], dtype=np.float32),
                    np.array([[50, 40], [90, 40], [90, 80], [50, 80]], dtype=np.float32),
                ]
            ),
        )

        response = yolo_results_to_response(
            image=image,
            results=[result],
            confidence_threshold=0.5,
        )

        self.assertEqual(response.image.width, 120)
        self.assertEqual(response.image.height, 100)
        self.assertEqual([obj.kind for obj in response.objects], ["hold", "volume"])
        self.assertEqual(response.objects[0].id, "obj_hold_01")
        self.assertEqual(response.objects[0].bbox.model_dump(), {"x": 10, "y": 10, "width": 20, "height": 20})
        self.assertEqual(response.objects[0].center.model_dump(), {"x": 20, "y": 20})
        self.assertEqual(response.objects[0].color.hex, "#1e140a")
        self.assertEqual(response.objects[1].id, "obj_volume_01")

    def test_filters_low_confidence_unknown_classes_and_missing_masks(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        result = SimpleNamespace(
            names={0: "hold", 1: "volume", 2: "person"},
            boxes=SimpleNamespace(
                cls=np.array([0, 2, 1], dtype=np.float32),
                conf=np.array([0.2, 0.99, 0.8], dtype=np.float32),
            ),
            masks=SimpleNamespace(
                xy=[
                    np.array([[1, 1], [5, 1], [5, 5]], dtype=np.float32),
                    np.array([[10, 10], [20, 10], [20, 20]], dtype=np.float32),
                    np.array([[40, 40], [70, 40], [70, 70], [40, 70]], dtype=np.float32),
                ]
            ),
        )

        response = yolo_results_to_response(
            image=image,
            results=[result],
            confidence_threshold=0.5,
        )

        self.assertEqual(len(response.objects), 1)
        self.assertEqual(response.objects[0].kind, "volume")
        self.assertEqual(response.objects[0].bbox.model_dump(), {"x": 40, "y": 40, "width": 30, "height": 30})

    def test_assigns_parent_volume_when_hold_center_is_inside_volume(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        result = SimpleNamespace(
            names={0: "hold", 1: "volume"},
            boxes=SimpleNamespace(
                cls=np.array([1, 0], dtype=np.float32),
                conf=np.array([0.9, 0.9], dtype=np.float32),
            ),
            masks=SimpleNamespace(
                xy=[
                    np.array([[10, 10], [80, 10], [80, 80], [10, 80]], dtype=np.float32),
                    np.array([[30, 30], [40, 30], [40, 40], [30, 40]], dtype=np.float32),
                ]
            ),
        )

        response = yolo_results_to_response(image=image, results=[result])

        hold = next(obj for obj in response.objects if obj.kind == "hold")
        self.assertEqual(hold.parentVolumeObjectId, "obj_volume_01")


if __name__ == "__main__":
    unittest.main()
