import type { SimulationPoint } from "./simulation";

export type SkeletonEndpointId =
  | "leftHand"
  | "rightHand"
  | "leftFoot"
  | "rightFoot";

export type SkeletonControlJointId =
  | "leftElbow"
  | "rightElbow"
  | "leftKnee"
  | "rightKnee";

export type SkeletonJointId =
  | "head"
  | "neck"
  | "torso"
  | "pelvis"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftHand"
  | "rightHand"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftFoot"
  | "rightFoot";

export type SkeletonJointMap = Record<SkeletonJointId, SimulationPoint>;

export type SkeletonBodyModel = {
  height: number;
  wingspan: number;
  scale: number;
  headRadius: number;
  neckToTorso: number;
  torsoToPelvis: number;
  shoulderWidth: number;
  hipWidth: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
};

export type SkeletonPose = {
  joints: SkeletonJointMap;
};

export type SkeletonDragResolutionMode = "pose" | "core";

export type SkeletonDragResolution = {
  pose: SkeletonPose;
  mode: SkeletonDragResolutionMode;
};

export type SkeletonStraightCoreDragState = {
  hasReachedStraight: boolean;
  canUseCoreDrag: boolean;
};

export type SkeletonDragInput = {
  endpointId: SkeletonEndpointId;
  target: SimulationPoint;
  previousMode?: SkeletonDragResolutionMode | null;
  straightCoreDragAllowed?: boolean;
};

export type SkeletonJointDragInput = {
  jointId: SkeletonControlJointId;
  target: SimulationPoint;
  previousMode?: SkeletonDragResolutionMode | null;
  coreDragAllowed?: boolean;
};

export type SkeletonHeadDragInput = {
  target: SimulationPoint;
};

export type SkeletonCoreDragInput = {
  delta: SimulationPoint;
};
