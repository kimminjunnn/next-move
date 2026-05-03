from app.schemas import DetectedWallObject, SelectRouteResponse

ROUTE_COLOR_DISTANCE_THRESHOLD = 48


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


def _is_similar_route_color(color_a: str, color_b: str) -> bool:
    if color_a.lower() == color_b.lower():
        return True

    rgb_a = _parse_hex_color(color_a)
    rgb_b = _parse_hex_color(color_b)
    if rgb_a is None or rgb_b is None:
        return False

    squared_distance = sum(
        (component_a - component_b) ** 2
        for component_a, component_b in zip(rgb_a, rgb_b)
    )
    return squared_distance <= ROUTE_COLOR_DISTANCE_THRESHOLD**2


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
        if obj.kind == "hold" and _is_similar_route_color(obj.color.hex, start.color.hex)
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
