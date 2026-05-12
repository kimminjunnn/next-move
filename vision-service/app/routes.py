from fastapi import APIRouter, HTTPException

from app.image_loader import load_image
from app.roboflow_detection import RoboflowConfigError
from app.route_helper import build_route_response
from app.schemas import (
    AnalyzeWallRequest,
    AnalyzeWallResponse,
    SelectRouteRequest,
    SelectRouteResponse,
)
from app.yolo_detection import YoloModelError, infer_wall_objects_with_yolo

router = APIRouter()


@router.post("/internal/analyze-wall", response_model=AnalyzeWallResponse)
def analyze_wall(payload: AnalyzeWallRequest):
    try:
        image = load_image(payload)
        result = infer_wall_objects_with_yolo(image)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except RoboflowConfigError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except YoloModelError:
        raise HTTPException(status_code=502, detail="yolo_inference_failed")
    except Exception:
        raise HTTPException(status_code=500, detail="analyze_wall_failed")

    if len(result.objects) == 0:
        raise HTTPException(status_code=422, detail="no_objects_detected")

    return result


@router.post("/internal/select-route", response_model=SelectRouteResponse)
def select_route(payload: SelectRouteRequest):
    try:
        return build_route_response(
            start_hold_object_id=payload.startHoldObjectId,
            objects=payload.objects,
        )
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_start_hold")
