export type SimulationPhotoSource = "camera" | "library";

export type SimulationMode = "input" | "adjust" | "canvas";

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
