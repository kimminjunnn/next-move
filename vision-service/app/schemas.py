from typing import List, Literal, Optional

from pydantic import BaseModel, model_validator


class Point(BaseModel):
    x: int
    y: int


class BBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class Color(BaseModel):
    hex: str


class ImageMeta(BaseModel):
    width: int
    height: int


class DetectedWallObject(BaseModel):
    id: str
    kind: Literal["hold", "volume"]
    bbox: BBox
    center: Point
    contour: List[Point]
    color: Color
    parentVolumeObjectId: Optional[str] = None


class AnalyzeWallRequest(BaseModel):
    imagePath: Optional[str] = None
    imageUrl: Optional[str] = None

    @model_validator(mode="after")
    def validate_source(self):
        if not self.imagePath and not self.imageUrl:
            raise ValueError("imagePath or imageUrl is required")
        return self


class AnalyzeWallResponse(BaseModel):
    image: ImageMeta
    objects: List[DetectedWallObject]


class SelectRouteRequest(BaseModel):
    analysisId: str
    startHoldObjectId: str
    objects: List[DetectedWallObject]


class SelectRouteResponse(BaseModel):
    routeColor: Color
    includedObjectIds: List[str]
