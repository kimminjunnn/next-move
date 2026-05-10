import type { ImageSourcePropType } from "react-native";

import type { Point2D } from "./geometry";
import type { SkeletonBodyModel, SkeletonPointName } from "./skeletonPose";

export type CharacterRigPartId = string;
export type CharacterRigFacing = "back" | "left" | "right";

export type CharacterRigSize = {
  height: number;
  width: number;
};

type CharacterRigBasePart = {
  id: CharacterRigPartId;
  nativeSize: CharacterRigSize;
  opacity?: number;
  source: ImageSourcePropType;
  visibleWhen?: {
    facing?: CharacterRigFacing[];
  };
  zIndex: number;
};

export type CharacterRigLimbPart = CharacterRigBasePart & {
  centerOffset?: Point2D;
  from: SkeletonPointName;
  fromOffset?: Point2D;
  kind: "limb";
  lengthBasis?: "anchors" | "joints";
  lengthScale?: number;
  rotationOffsetDeg?: number;
  thicknessScale?: number;
  to: SkeletonPointName;
  toOffset?: Point2D;
};

export type CharacterRigSizeBasis =
  | "headRadius"
  | "hipWidth"
  | "shoulderWidth"
  | "torsoLength";

export type CharacterRigAnchorPart = CharacterRigBasePart & {
  anchor: SkeletonPointName;
  kind: "anchor";
  offset?: Point2D;
  rotation?: {
    from: SkeletonPointName;
    offsetDeg?: number;
    to: SkeletonPointName;
  };
  rotationClampDeg?: {
    max: number;
    min: number;
  };
  rotationSway?: {
    clampDeg?: {
      max: number;
      min: number;
    };
    input: "tailSwayDeg";
    multiplier?: number;
  };
  sizeBasis: CharacterRigSizeBasis;
  sizeMultiplier: number;
};

export type CharacterRigPart = CharacterRigAnchorPart | CharacterRigLimbPart;

export type ComputedCharacterPartTransform = {
  center: Point2D;
  height: number;
  id: CharacterRigPartId;
  opacity: number;
  rotationDeg: number;
  source: ImageSourcePropType;
  width: number;
  zIndex: number;
};

export type CharacterRigTransformOptions = {
  facing?: CharacterRigFacing;
  tailSwayDeg?: number;
};

export type CharacterRigTransformInput = {
  model: SkeletonBodyModel;
  pose: {
    joints: Record<SkeletonPointName, Point2D>;
  };
};
