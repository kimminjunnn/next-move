from app.schemas import DetectedWallObject, SelectRouteResponse

COLORED_HUE_THRESHOLD_DEGREES = 24
COLORED_SATURATION_THRESHOLD = 0.38
NEUTRAL_CHROMA_THRESHOLD = 0.10
NEUTRAL_VALUE_THRESHOLD = 0.24

ColorFeature = tuple[float, float, float, float]


def _parse_hex_color(hex_color: str) -> tuple[int, int, int] | None:
    normalized = hex_color.strip().lstrip("#")
    if len(normalized) != 6:
        return None

    try:
        return (
            int(normalized[0:2], 16),
            int(normalized[2:4], 16),
            int(normalized[4:6], 16),
        )
    except ValueError:
        return None


def _rgb_to_color_feature(rgb: tuple[int, int, int]) -> ColorFeature:
    red, green, blue = (component / 255 for component in rgb)
    max_component = max(red, green, blue)
    min_component = min(red, green, blue)
    chroma = max_component - min_component

    if chroma == 0:
        hue = 0
    elif max_component == red:
        hue = (60 * ((green - blue) / chroma) + 360) % 360
    elif max_component == green:
        hue = 60 * ((blue - red) / chroma) + 120
    else:
        hue = 60 * ((red - green) / chroma) + 240

    saturation = 0 if max_component == 0 else chroma / max_component
    return hue, saturation, max_component, chroma


def _hex_to_color_feature(hex_color: str) -> ColorFeature | None:
    rgb = _parse_hex_color(hex_color)
    if rgb is None:
        return None

    return _rgb_to_color_feature(rgb)


def _hue_distance_degrees(hue_a: float, hue_b: float) -> float:
    distance = abs(hue_a - hue_b)
    return min(distance, 360 - distance)


def _is_neutral(feature: ColorFeature) -> bool:
    return feature[3] <= NEUTRAL_CHROMA_THRESHOLD


def _is_similar_route_color(color_a: str, color_b: str) -> bool:
    if color_a.lower() == color_b.lower():
        return True

    feature_a = _hex_to_color_feature(color_a)
    feature_b = _hex_to_color_feature(color_b)
    if feature_a is None or feature_b is None:
        return False

    neutral_a = _is_neutral(feature_a)
    neutral_b = _is_neutral(feature_b)
    if neutral_a or neutral_b:
        return (
            neutral_a
            and neutral_b
            and abs(feature_a[2] - feature_b[2]) <= NEUTRAL_VALUE_THRESHOLD
        )

    hue_a, saturation_a, _, _ = feature_a
    hue_b, saturation_b, _, _ = feature_b
    return (
        _hue_distance_degrees(hue_a, hue_b) <= COLORED_HUE_THRESHOLD_DEGREES
        and abs(saturation_a - saturation_b) <= COLORED_SATURATION_THRESHOLD
    )


def _cluster_holds_by_route_color(
    start_hold_object_id: str, holds: list[DetectedWallObject]
) -> list[DetectedWallObject]:
    holds_by_id = {obj.id: obj for obj in holds}
    start = holds_by_id[start_hold_object_id]

    return [
        obj
        for obj in holds
        if obj.id == start.id or _is_similar_route_color(start.color.hex, obj.color.hex)
    ]


def build_route_response(
    start_hold_object_id: str, objects: list[DetectedWallObject]
) -> SelectRouteResponse:
    start = next(
        (obj for obj in objects if obj.id == start_hold_object_id and obj.kind == "hold"),
        None,
    )
    if not start:
        raise ValueError("invalid_start_hold")

    holds = [obj for obj in objects if obj.kind == "hold"]
    same_color_holds = _cluster_holds_by_route_color(start_hold_object_id, holds)

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
