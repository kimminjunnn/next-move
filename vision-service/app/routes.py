from fastapi import APIRouter, HTTPException

from app.fixtures import build_analyze_response, build_route_response
from app.schemas import (
    AnalyzeWallRequest,
    AnalyzeWallResponse,
    SelectRouteRequest,
    SelectRouteResponse,
)

router = APIRouter()


@router.post("/internal/analyze-wall", response_model=AnalyzeWallResponse)
def analyze_wall(_: AnalyzeWallRequest):
    return build_analyze_response()


@router.post("/internal/select-route", response_model=SelectRouteResponse)
def select_route(payload: SelectRouteRequest):
    try:
        return build_route_response(
            start_hold_object_id=payload.startHoldObjectId,
            objects=payload.objects,
        )
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_start_hold")
