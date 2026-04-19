export type SimulationPhotoSource = "camera" | "library";

export type SimulationMode = "input" | "adjust" | "canvas";

export type SimulationPoint = {
  x: number;
  y: number;
};

export type SimulationPhoto = {
  uri: string;
  width: number;
  height: number;
  source: SimulationPhotoSource;
  updatedAt: number;
};

export type SimulationPhotoTransform = {
  scale: number;
  offsetXRatio: number;
  offsetYRatio: number;
};

export type SimulationHoldContour = SimulationPoint[];

export type SimulationDetectedObjectKind = "hold" | "volume";

export type SimulationDetectedObject = {
  id: string;
  kind: SimulationDetectedObjectKind;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: SimulationPoint;
  contour: SimulationHoldContour;
  color: {
    hex: string;
  };
  parentVolumeObjectId: string | null;
};

export type WallAnalysisResult = {
  id: string;
  image: {
    width: number;
    height: number;
  };
  objects: SimulationDetectedObject[];
};

export type RouteSelectionResult = {
  analysisId: string;
  startHoldObjectId: string;
  routeColor: {
    hex: string;
  };
  includedObjectIds: string[];
};
