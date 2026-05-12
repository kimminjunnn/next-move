import json
import sys
import tempfile
import unittest
from pathlib import Path

import cv2
import numpy as np

sys.path.append(str(Path(__file__).resolve().parents[1] / "tools"))

from convert_rupa_coco_to_yolo import (  # noqa: E402
    convert_coco_split_to_yolo,
    convert_rupa_coco_to_yolo,
    yolo_output_split,
)


def _write_coco_split(root: Path, split: str) -> None:
    split_dir = root / split
    split_dir.mkdir(parents=True)
    image = np.full((20, 10, 3), 240, dtype=np.uint8)
    cv2.imwrite(str(split_dir / "wall.jpg"), image)
    coco = {
        "images": [{"id": 1, "file_name": "wall.jpg", "width": 10, "height": 20}],
        "categories": [
            {"id": 0, "name": "holds"},
            {"id": 3, "name": "hold"},
            {"id": 7, "name": "volume"},
        ],
        "annotations": [
            {
                "id": 11,
                "image_id": 1,
                "category_id": 3,
                "segmentation": [[1, 2, 5, 2, 5, 10, 1, 10]],
            },
            {
                "id": 12,
                "image_id": 1,
                "category_id": 7,
                "segmentation": [[2, 4, 8, 4, 8, 16, 2, 16]],
            },
        ],
    }
    (split_dir / "_annotations.coco.json").write_text(json.dumps(coco), encoding="utf-8")


class ConvertRupaCocoToYoloTests(unittest.TestCase):
    def test_valid_split_maps_to_yolo_val_split(self):
        self.assertEqual(yolo_output_split("valid"), "val")
        self.assertEqual(yolo_output_split("train"), "train")
        self.assertEqual(yolo_output_split("test"), "test")

    def test_converts_coco_segmentation_annotations_to_yolo_txt_labels(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dataset = Path(temp_dir) / "source"
            output = Path(temp_dir) / "output"
            _write_coco_split(dataset, "train")

            summary = convert_coco_split_to_yolo(dataset, output, "train")

            label_path = output / "labels" / "train" / "wall.txt"
            image_path = output / "images" / "train" / "wall.jpg"
            lines = label_path.read_text(encoding="utf-8").splitlines()
            image_exists = image_path.exists()

        self.assertEqual(summary.image_count, 1)
        self.assertEqual(summary.label_count, 2)
        self.assertTrue(image_exists)
        self.assertEqual(lines[0], "0 0.100000 0.100000 0.500000 0.100000 0.500000 0.500000 0.100000 0.500000")
        self.assertEqual(lines[1], "1 0.200000 0.200000 0.800000 0.200000 0.800000 0.800000 0.200000 0.800000")

    def test_converts_dataset_and_writes_data_yaml(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dataset = Path(temp_dir) / "source"
            output = Path(temp_dir) / "output"
            _write_coco_split(dataset, "train")
            _write_coco_split(dataset, "valid")

            summary = convert_rupa_coco_to_yolo(dataset, output, ["train", "valid"])

            data_yaml = (output / "data.yaml").read_text(encoding="utf-8")

        self.assertEqual(summary["train"].label_count, 2)
        self.assertEqual(summary["valid"].label_count, 2)
        self.assertIn(f"path: {output.resolve()}", data_yaml)
        self.assertIn("train: images/train", data_yaml)
        self.assertIn("val: images/val", data_yaml)
        self.assertIn("names: [hold, volume]", data_yaml)


if __name__ == "__main__":
    unittest.main()
