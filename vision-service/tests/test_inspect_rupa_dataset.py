import json
import sys
import tempfile
import unittest
from pathlib import Path

import cv2
import numpy as np

sys.path.append(str(Path(__file__).resolve().parents[1] / "tools"))

from inspect_rupa_dataset import (  # noqa: E402
    build_dataset_summary,
    default_output_dir,
    write_overlay_sample,
)


def _write_coco_split(root: Path, split: str, file_name: str = "wall.jpg") -> Path:
    split_dir = root / split
    split_dir.mkdir(parents=True)
    image = np.full((16, 16, 3), 245, dtype=np.uint8)
    cv2.imwrite(str(split_dir / file_name), image)
    annotations = {
        "images": [{"id": 1, "file_name": file_name, "width": 16, "height": 16}],
        "categories": [
            {"id": 0, "name": "holds"},
            {"id": 1, "name": "hold"},
            {"id": 2, "name": "volume"},
        ],
        "annotations": [
            {
                "id": 10,
                "image_id": 1,
                "category_id": 1,
                "bbox": [1, 1, 6, 6],
                "segmentation": [[1, 1, 7, 1, 7, 7, 1, 7]],
            },
            {
                "id": 11,
                "image_id": 1,
                "category_id": 2,
                "bbox": [8, 8, 5, 5],
                "segmentation": [[8, 8, 13, 8, 13, 13, 8, 13]],
            },
        ],
    }
    (split_dir / "_annotations.coco.json").write_text(
        json.dumps(annotations),
        encoding="utf-8",
    )
    return split_dir


class InspectRupaDatasetTests(unittest.TestCase):
    def test_builds_summary_for_coco_segmentation_splits(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dataset = Path(temp_dir) / "roboflow-climbtag-v22-coco"
            _write_coco_split(dataset, "train")
            _write_coco_split(dataset, "valid")

            summary = build_dataset_summary(dataset, ["train", "valid", "test"])

        self.assertEqual(summary.dataset_name, "roboflow-climbtag-v22-coco")
        self.assertEqual(summary.splits["train"].image_count, 1)
        self.assertEqual(summary.splits["train"].annotation_count, 2)
        self.assertEqual(summary.splits["train"].annotation_count_by_category, {"hold": 1, "volume": 1})
        self.assertEqual(summary.splits["valid"].annotation_count_by_category, {"hold": 1, "volume": 1})
        self.assertNotIn("test", summary.splits)

    def test_default_output_dir_goes_to_dataset_inspections_folder(self):
        dataset = Path("/Users/mj/Dev/rupa-datasets/roboflow-climbtag-v22-coco")

        output_dir = default_output_dir(dataset)

        self.assertEqual(
            output_dir,
            Path("/Users/mj/Dev/rupa-datasets/inspections/roboflow-climbtag-v22-coco/overlays"),
        )

    def test_writes_overlay_image_for_sample_annotation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dataset = Path(temp_dir) / "roboflow-climbtag-v22-coco"
            split_dir = _write_coco_split(dataset, "train")
            output_dir = Path(temp_dir) / "inspections"

            output_path = write_overlay_sample(split_dir, output_dir, sample_index=0)

            self.assertTrue(output_path.exists())
            rendered = cv2.imread(str(output_path))
            self.assertIsNotNone(rendered)
            self.assertEqual(rendered.shape[:2], (16, 16))


if __name__ == "__main__":
    unittest.main()
