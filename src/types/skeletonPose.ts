import type { Point2D } from "./geometry";

export type SkeletonEndpointName =
  | "leftHand"
  | "rightHand"
  | "leftFoot"
  | "rightFoot";

export type SkeletonControlJointName =
  | "leftElbow"
  | "rightElbow"
  | "leftKnee"
  | "rightKnee";

export type SkeletonPointName =
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

export type SkeletonPointMap = Record<SkeletonPointName, Point2D>;

export type SkeletonBodyModel = {
  height: number;
  wingspan: number;
  scale: number;
  headRadius: number;
  headToNeck: number;
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
  joints: SkeletonPointMap;
};

export type SkeletonDragResolutionMode = "pose" | "core";

export type SkeletonDragResolution = {
  pose: SkeletonPose;
  mode: SkeletonDragResolutionMode;
};

export type SkeletonDragInput = {
  endpointName: SkeletonEndpointName;
  target: Point2D;
  previousMode?: SkeletonDragResolutionMode | null;
};

export type SkeletonJointDragInput = {
  jointName: SkeletonControlJointName;
  target: Point2D;
  previousMode?: SkeletonDragResolutionMode | null;
  coreDragAllowed?: boolean;
};

export type SkeletonHeadDragInput = {
  target: Point2D;
};

export type SkeletonCoreDragInput = {
  delta: Point2D;
};
