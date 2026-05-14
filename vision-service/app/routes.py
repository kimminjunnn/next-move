import os
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.detection_utils import WallDetectionConfigError, WallDetectionInferenceError
from app.image_loader import load_image_payload
from app.route_helper import build_route_response
from app.schemas import (
    AnalyzeWallResponse,
    SelectRouteRequest,
    SelectRouteResponse,
)
from app.wall_detection import infer_wall_objects
from app.wall_detection import DEFAULT_PROVIDER, PROVIDER_ENV
from app.yolo_provider import MODEL_PATH_ENV

router = APIRouter()


@router.get("/health")
def health():
    model_path = os.environ.get(MODEL_PATH_ENV)
    return {
        "ok": True,
        "service": "vision-service",
        "wallDetectionProvider": os.environ.get(PROVIDER_ENV, DEFAULT_PROVIDER),
        "modelPathConfigured": bool(model_path),
        "modelPathExists": bool(model_path and Path(model_path).expanduser().exists()),
    }


@router.post("/internal/analyze-wall", response_model=AnalyzeWallResponse)
async def analyze_wall(file: UploadFile = File(...)):
    try:
        payload = await file.read()
        image = load_image_payload(file.filename or "wall.jpg", payload)
        result = infer_wall_objects(image)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except WallDetectionConfigError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except WallDetectionInferenceError as error:
        raise HTTPException(status_code=502, detail=str(error))
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
