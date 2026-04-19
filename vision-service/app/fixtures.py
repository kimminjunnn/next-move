from app.schemas import (
    AnalyzeWallResponse,
    BBox,
    Color,
    DetectedWallObject,
    ImageMeta,
    Point,
    SelectRouteResponse,
)

MOCK_OBJECTS = [
    DetectedWallObject(
        id="obj_hold_01",
        kind="hold",
        bbox=BBox(x=220, y=1820, width=88, height=96),
        center=Point(x=264, y=1868),
        contour=[
            Point(x=226, y=1832),
            Point(x=250, y=1822),
            Point(x=296, y=1840),
            Point(x=301, y=1898),
            Point(x=244, y=1911),
        ],
        color=Color(hex="#ff6a1a"),
        parentVolumeObjectId="obj_volume_01",
    ),
    DetectedWallObject(
        id="obj_hold_02",
        kind="hold",
        bbox=BBox(x=508, y=1608, width=92, height=104),
        center=Point(x=554, y=1660),
        contour=[
            Point(x=516, y=1619),
            Point(x=548, y=1609),
            Point(x=591, y=1634),
            Point(x=584, y=1701),
            Point(x=529, y=1710),
        ],
        color=Color(hex="#ff6a1a"),
        parentVolumeObjectId=None,
    ),
    DetectedWallObject(
        id="obj_hold_03",
        kind="hold",
        bbox=BBox(x=782, y=1452, width=90, height=110),
        center=Point(x=827, y=1507),
        contour=[
            Point(x=790, y=1464),
            Point(x=824, y=1453),
            Point(x=864, y=1482),
            Point(x=856, y=1548),
            Point(x=804, y=1561),
        ],
        color=Color(hex="#54c21f"),
        parentVolumeObjectId=None,
    ),
    DetectedWallObject(
        id="obj_volume_01",
        kind="volume",
        bbox=BBox(x=176, y=1768, width=188, height=206),
        center=Point(x=270, y=1871),
        contour=[
            Point(x=188, y=1786),
            Point(x=344, y=1778),
            Point(x=358, y=1952),
            Point(x=202, y=1969),
        ],
        color=Color(hex="#1f1f1f"),
        parentVolumeObjectId=None,
    ),
]


def build_analyze_response() -> AnalyzeWallResponse:
    return AnalyzeWallResponse(image=ImageMeta(width=1179, height=2556), objects=MOCK_OBJECTS)


def build_route_response(
    start_hold_object_id: str, objects: list[DetectedWallObject]
) -> SelectRouteResponse:
    start = next(
        (obj for obj in objects if obj.id == start_hold_object_id and obj.kind == "hold"),
        None,
    )
    if not start:
        raise ValueError("invalid_start_hold")

    same_color_holds = [
        obj
        for obj in objects
        if obj.kind == "hold" and obj.color.hex.lower() == start.color.hex.lower()
    ]

    included_ids: set[str] = {obj.id for obj in same_color_holds}
    parent_volume_ids = {
        obj.parentVolumeObjectId
        for obj in same_color_holds
        if obj.parentVolumeObjectId is not None
    }
    included_ids.update(parent_volume_ids)

    return SelectRouteResponse(
        routeColor=start.color,
        includedObjectIds=sorted(included_ids),
    )
