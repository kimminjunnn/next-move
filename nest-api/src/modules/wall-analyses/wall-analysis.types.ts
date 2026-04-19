export type Point = {
  x: number;
  y: number;
};

export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectedWallObject = {
  id: string;
  kind: "hold" | "volume";
  bbox: BBox;
  center: Point;
  contour: Point[];
  color: { hex: string };
  parentVolumeObjectId: string | null;
};

export type WallAnalysisResponse = {
  id: string;
  image: {
    width: number;
    height: number;
  };
  objects: DetectedWallObject[];
};

export type RouteSelectionResponse = {
  analysisId: string;
  startHoldObjectId: string;
  routeColor: { hex: string };
  includedObjectIds: string[];
};
