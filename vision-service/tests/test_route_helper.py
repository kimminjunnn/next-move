import unittest

from app.route_helper import build_route_response
from app.schemas import BBox, Color, DetectedWallObject, Point


def _wall_object(
    object_id: str,
    hex_color: str,
    *,
    kind: str = "hold",
    parent_volume_object_id: str | None = None,
) -> DetectedWallObject:
    return DetectedWallObject(
        id=object_id,
        kind=kind,
        bbox=BBox(x=0, y=0, width=10, height=10),
        center=Point(x=5, y=5),
        contour=[
            Point(x=0, y=0),
            Point(x=10, y=0),
            Point(x=10, y=10),
            Point(x=0, y=10),
        ],
        color=Color(hex=hex_color),
        parentVolumeObjectId=parent_volume_object_id,
    )


class RouteHelperTests(unittest.TestCase):
    def test_groups_red_and_pink_route_under_brightness_variation(self):
        objects = [
            _wall_object("start", "#d3263a", parent_volume_object_id="volume-red"),
            _wall_object("pink-bright", "#ff6f86"),
            _wall_object("red-dark", "#8e1428"),
            _wall_object("orange", "#df7b24"),
            _wall_object("volume-red", "#9b3240", kind="volume"),
        ]

        result = build_route_response("start", objects)

        self.assertEqual(result.routeColor.hex, "#d3263a")
        self.assertEqual(
            result.includedObjectIds,
            ["pink-bright", "red-dark", "start", "volume-red"],
        )

    def test_excludes_different_color_with_similar_brightness(self):
        objects = [
            _wall_object("start", "#2f73d9"),
            _wall_object("blue-light", "#67a7ff"),
            _wall_object("green-same-brightness", "#30d973"),
        ]

        result = build_route_response("start", objects)

        self.assertEqual(result.includedObjectIds, ["blue-light", "start"])

    def test_does_not_expand_route_through_hue_chain(self):
        objects = [
            _wall_object("start", "#d3263a"),
            _wall_object("near-red", "#dd4c35"),
            _wall_object("orange-drift", "#df7b24"),
        ]

        result = build_route_response("start", objects)

        self.assertEqual(result.includedObjectIds, ["near-red", "start"])

    def test_groups_white_and_gray_low_saturation_route(self):
        objects = [
            _wall_object("start", "#f2f2ee"),
            _wall_object("white", "#ffffff"),
            _wall_object("gray", "#cfcfca"),
            _wall_object("black", "#202020"),
            _wall_object("pale-blue", "#d8e4ff"),
        ]

        result = build_route_response("start", objects)

        self.assertEqual(result.includedObjectIds, ["gray", "start", "white"])

    def test_invalid_start_still_errors(self):
        with self.assertRaisesRegex(ValueError, "invalid_start_hold"):
            build_route_response("missing", [_wall_object("hold-1", "#ff0000")])


if __name__ == "__main__":
    unittest.main()
