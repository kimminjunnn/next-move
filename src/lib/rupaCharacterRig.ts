import type { ImageSourcePropType } from "react-native";

import type { Point2D } from "../types/geometry";
import type {
  CharacterRigAnchorPart,
  CharacterRigFacing,
  CharacterRigPart,
  CharacterRigSizeBasis,
  CharacterRigLimbPart,
  CharacterRigTransformOptions,
  ComputedCharacterPartTransform,
} from "../types/characterRig";
import type { SkeletonBodyModel, SkeletonPose } from "../types/skeletonPose";

export const RUPA_BACK_CHARACTER_PARTS = [
  {
    id: "tail",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/tail.png"),
    anchor: "pelvis",
    nativeSize: { width: 210, height: 190 },
    offset: { x: 28, y: -8 },
    rotation: { from: "torso", to: "pelvis", offsetDeg: -12 },
    rotationClampDeg: { min: 24, max: 42 },
    rotationSway: { input: "tailSwayDeg", clampDeg: { min: -18, max: 18 } },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 1.65,
    zIndex: 5,
  },
  {
    id: "leftUpperArm",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/upper-arm-left.png"),
    from: "leftShoulder",
    to: "leftElbow",
    fromOffset: { x: -6, y: 8 },
    toOffset: { x: -1, y: 0 },
    nativeSize: { width: 180, height: 70 },
    lengthBasis: "joints",
    lengthScale: 1.35,
    thicknessScale: 1.15,
    zIndex: 16,
  },
  {
    id: "rightUpperArm",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/upper-arm-right.png"),
    from: "rightShoulder",
    to: "rightElbow",
    fromOffset: { x: 6, y: 8 },
    toOffset: { x: 1, y: 0 },
    nativeSize: { width: 180, height: 70 },
    lengthBasis: "joints",
    lengthScale: 1.35,
    thicknessScale: 1.15,
    zIndex: 16,
  },
  {
    id: "leftThigh",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/thigh-left.png"),
    from: "leftHip",
    to: "leftKnee",
    nativeSize: { width: 130, height: 72 },
    lengthScale: 1.12,
    thicknessScale: 1.15,
    zIndex: 18,
  },
  {
    id: "rightThigh",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/thigh-right.png"),
    from: "rightHip",
    to: "rightKnee",
    nativeSize: { width: 130, height: 72 },
    lengthScale: 1.12,
    thicknessScale: 1.15,
    zIndex: 18,
  },
  {
    id: "leftShin",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/shin-left.png"),
    from: "leftKnee",
    to: "leftFoot",
    nativeSize: { width: 140, height: 66 },
    lengthScale: 1.1,
    thicknessScale: 1.05,
    zIndex: 19,
  },
  {
    id: "rightShin",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/shin-right.png"),
    from: "rightKnee",
    to: "rightFoot",
    nativeSize: { width: 140, height: 66 },
    lengthScale: 1.1,
    thicknessScale: 1.05,
    zIndex: 19,
  },
  {
    id: "torsoBack",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/torso-back.png"),
    anchor: "torso",
    nativeSize: { width: 150, height: 260 },
    offset: { x: 0, y: 18 },
    rotation: { from: "neck", to: "pelvis", offsetDeg: -90 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 1.2,
    zIndex: 30,
  },
  {
    id: "leftForearm",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/forearm-left.png"),
    from: "leftElbow",
    to: "leftHand",
    nativeSize: { width: 170, height: 64 },
    lengthScale: 1.18,
    thicknessScale: 1.18,
    zIndex: 36,
  },
  {
    id: "rightForearm",
    kind: "limb",
    source: require("../../assets/rupa_theme/character/back/forearm-right.png"),
    from: "rightElbow",
    to: "rightHand",
    nativeSize: { width: 170, height: 64 },
    lengthScale: 1.18,
    thicknessScale: 1.18,
    zIndex: 36,
  },
  {
    id: "headBack",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/head-back.png"),
    anchor: "head",
    nativeSize: { width: 360, height: 340 },
    offset: { x: 0, y: 2 },
    rotation: { from: "neck", to: "head", offsetDeg: 90 },
    rotationClampDeg: { min: -55, max: 55 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 1.22,
    visibleWhen: { facing: ["back"] },
    zIndex: 45,
  },
  {
    id: "headLeft",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/head-left.png"),
    anchor: "head",
    nativeSize: { width: 360, height: 340 },
    offset: { x: -2, y: 2 },
    rotation: { from: "neck", to: "head", offsetDeg: 90 },
    rotationClampDeg: { min: -55, max: 55 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 1.2,
    visibleWhen: { facing: ["left"] },
    zIndex: 45,
  },
  {
    id: "headRight",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/head-right.png"),
    anchor: "head",
    nativeSize: { width: 360, height: 340 },
    offset: { x: 2, y: 2 },
    rotation: { from: "neck", to: "head", offsetDeg: 90 },
    rotationClampDeg: { min: -55, max: 55 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 1.2,
    visibleWhen: { facing: ["right"] },
    zIndex: 45,
  },
  {
    id: "leftHand",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/hand-left.png"),
    anchor: "leftHand",
    nativeSize: { width: 88, height: 74 },
    rotation: { from: "leftElbow", to: "leftHand" },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 0.58,
    zIndex: 52,
  },
  {
    id: "rightHand",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/hand-right.png"),
    anchor: "rightHand",
    nativeSize: { width: 88, height: 74 },
    rotation: { from: "rightElbow", to: "rightHand" },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 0.58,
    zIndex: 52,
  },
  {
    id: "leftFoot",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/foot-left.png"),
    anchor: "leftFoot",
    nativeSize: { width: 98, height: 68 },
    offset: { x: 10, y: 0 },
    rotation: { from: "leftKnee", to: "leftFoot", offsetDeg: 90 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 0.58,
    zIndex: 53,
  },
  {
    id: "rightFoot",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/foot-right.png"),
    anchor: "rightFoot",
    nativeSize: { width: 98, height: 68 },
    offset: { x: -10, y: 0 },
    rotation: { from: "rightKnee", to: "rightFoot", offsetDeg: 90 },
    sizeBasis: "shoulderWidth",
    sizeMultiplier: 0.58,
    zIndex: 53,
  },
  {
    id: "chalkBag",
    kind: "anchor",
    source: require("../../assets/rupa_theme/character/back/chalk-bag.png"),
    anchor: "pelvis",
    nativeSize: { width: 104, height: 120 },
    offset: { x: 0, y: 14 },
    rotation: { from: "torso", to: "pelvis", offsetDeg: -90 },
    sizeBasis: "hipWidth",
    sizeMultiplier: 1.75,
    zIndex: 62,
  },
] as const satisfies CharacterRigPart[];

type RupaBackCharacterPartId = (typeof RUPA_BACK_CHARACTER_PARTS)[number]["id"];

const RUPA_CARTOON_CHARACTER_SOURCES: Record<
  RupaBackCharacterPartId,
  ImageSourcePropType
> = {
  chalkBag: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/chalk-bag.png"),
  headBack: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/head-back.png"),
  headLeft: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/head-left.png"),
  headRight: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/head-right.png"),
  leftFoot: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/foot-left.png"),
  leftForearm: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/forearm-left.png"),
  leftHand: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/hand-left.png"),
  leftShin: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/shin-left.png"),
  leftThigh: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/thigh-left.png"),
  leftUpperArm: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/upper-arm-left.png"),
  rightFoot: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/foot-right.png"),
  rightForearm: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/forearm-right.png"),
  rightHand: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/hand-right.png"),
  rightShin: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/shin-right.png"),
  rightThigh: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/thigh-right.png"),
  rightUpperArm: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/upper-arm-right.png"),
  tail: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/tail.png"),
  torsoBack: require("../../assets/rupa_theme/character/back-v7-cartoony-rig-parts/torso-back.png"),
};

const RUPA_MISCHIEF_CHARACTER_SOURCES: Record<
  RupaBackCharacterPartId,
  ImageSourcePropType
> = {
  chalkBag: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/chalk-bag.png"),
  headBack: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/head-back.png"),
  headLeft: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/head-left.png"),
  headRight: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/head-right.png"),
  leftFoot: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/foot-left.png"),
  leftForearm: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/forearm-left.png"),
  leftHand: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/hand-left.png"),
  leftShin: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/shin-left.png"),
  leftThigh: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/thigh-left.png"),
  leftUpperArm: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/upper-arm-left.png"),
  rightFoot: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/foot-right.png"),
  rightForearm: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/forearm-right.png"),
  rightHand: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/hand-right.png"),
  rightShin: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/shin-right.png"),
  rightThigh: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/thigh-right.png"),
  rightUpperArm: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/upper-arm-right.png"),
  tail: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/tail.png"),
  torsoBack: require("../../assets/rupa_theme/character/back-v8-mischief-rig-parts/torso-back.png"),
};

const RUPA_LUMI_CHARACTER_SOURCES: Record<
  RupaBackCharacterPartId,
  ImageSourcePropType
> = {
  chalkBag: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/chalk-bag.png"),
  headBack: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/head-back.png"),
  headLeft: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/head-left.png"),
  headRight: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/head-right.png"),
  leftFoot: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/foot-left.png"),
  leftForearm: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/forearm-left.png"),
  leftHand: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/hand-left.png"),
  leftShin: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/shin-left.png"),
  leftThigh: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/thigh-left.png"),
  leftUpperArm: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/upper-arm-left.png"),
  rightFoot: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/foot-right.png"),
  rightForearm: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/forearm-right.png"),
  rightHand: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/hand-right.png"),
  rightShin: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/shin-right.png"),
  rightThigh: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/thigh-right.png"),
  rightUpperArm: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/upper-arm-right.png"),
  tail: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/tail.png"),
  torsoBack: require("../../assets/rupa_theme/character/back-v9-lumi-rig-parts/torso-back.png"),
};

const RUPA_BORI_CHARACTER_SOURCES: Record<
  RupaBackCharacterPartId,
  ImageSourcePropType
> = {
  chalkBag: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/chalk-bag.png"),
  headBack: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/head-back.png"),
  headLeft: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/head-left.png"),
  headRight: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/head-right.png"),
  leftFoot: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/foot-left.png"),
  leftForearm: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/forearm-left.png"),
  leftHand: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/hand-left.png"),
  leftShin: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/shin-left.png"),
  leftThigh: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/thigh-left.png"),
  leftUpperArm: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/upper-arm-left.png"),
  rightFoot: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/foot-right.png"),
  rightForearm: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/forearm-right.png"),
  rightHand: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/hand-right.png"),
  rightShin: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/shin-right.png"),
  rightThigh: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/thigh-right.png"),
  rightUpperArm: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/upper-arm-right.png"),
  tail: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/tail.png"),
  torsoBack: require("../../assets/rupa_theme/character/back-v10-bori-rig-parts/torso-back.png"),
};

function createRupaCharacterPartsWithSources(
  sources: Record<RupaBackCharacterPartId, ImageSourcePropType>,
): ReadonlyArray<CharacterRigPart> {
  return RUPA_BACK_CHARACTER_PARTS.map((part) => ({
    ...part,
    source: sources[part.id],
  }));
}

export const RUPA_CARTOON_CHARACTER_PARTS =
  createRupaCharacterPartsWithSources(RUPA_CARTOON_CHARACTER_SOURCES);

export const RUPA_MISCHIEF_CHARACTER_PARTS =
  createRupaCharacterPartsWithSources(RUPA_MISCHIEF_CHARACTER_SOURCES);

export const RUPA_LUMI_CHARACTER_PARTS =
  createRupaCharacterPartsWithSources(RUPA_LUMI_CHARACTER_SOURCES);

export const RUPA_BORI_CHARACTER_PARTS =
  createRupaCharacterPartsWithSources(RUPA_BORI_CHARACTER_SOURCES);

export const RUPA_BACK_CHARACTER_VARIANTS = [
  {
    id: "illustrated",
    label: "일러스트",
    parts: RUPA_BACK_CHARACTER_PARTS,
  },
  {
    id: "cartoon",
    label: "카툰",
    parts: RUPA_CARTOON_CHARACTER_PARTS,
  },
  {
    id: "mischief",
    label: "시크",
    parts: RUPA_MISCHIEF_CHARACTER_PARTS,
  },
  {
    id: "lumi",
    label: "루미",
    parts: RUPA_LUMI_CHARACTER_PARTS,
  },
  {
    id: "bori",
    label: "보리",
    parts: RUPA_BORI_CHARACTER_PARTS,
  },
] as const;

export type RupaCharacterVariantId =
  (typeof RUPA_BACK_CHARACTER_VARIANTS)[number]["id"];

export function getRupaCharacterVariant(id: RupaCharacterVariantId) {
  return (
    RUPA_BACK_CHARACTER_VARIANTS.find((variant) => variant.id === id) ??
    RUPA_BACK_CHARACTER_VARIANTS[0]
  );
}

function getMidpoint(first: Point2D, second: Point2D): Point2D {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function scaleOffset(offset: Point2D | undefined, scale: number): Point2D {
  if (!offset) {
    return { x: 0, y: 0 };
  }

  return {
    x: offset.x * scale,
    y: offset.y * scale,
  };
}

function rotateOffset(offset: Point2D, degrees: number): Point2D {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: offset.x * cos - offset.y * sin,
    y: offset.x * sin + offset.y * cos,
  };
}

function getSizeBasisValue(
  basis: CharacterRigSizeBasis,
  model: SkeletonBodyModel,
) {
  switch (basis) {
    case "headRadius":
      return model.headRadius * 2;
    case "hipWidth":
      return model.hipWidth;
    case "shoulderWidth":
      return model.shoulderWidth;
    case "torsoLength":
      return model.neckToTorso + model.torsoToPelvis;
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getPointDistance(first: Point2D, second: Point2D) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function getRotationDegrees(from: Point2D, to: Point2D) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function isRigPartVisible(
  part: CharacterRigPart,
  options: CharacterRigTransformOptions,
) {
  const facing = options.facing ?? "back";

  if (part.visibleWhen?.facing) {
    return part.visibleWhen.facing.includes(facing);
  }

  return true;
}

export function getRupaHeadFacing(
  pose: SkeletonPose,
  activeControlId?: string | null,
): CharacterRigFacing {
  if (activeControlId === "leftHand" || activeControlId === "leftElbow") {
    return "left";
  }

  if (activeControlId === "rightHand" || activeControlId === "rightElbow") {
    return "right";
  }

  const center = pose.joints.torso;
  const leftReach = center.x - pose.joints.leftHand.x;
  const rightReach = pose.joints.rightHand.x - center.x;
  const reachThreshold = 34;

  if (leftReach > rightReach + 10 && leftReach > reachThreshold) {
    return "left";
  }

  if (rightReach > leftReach + 10 && rightReach > reachThreshold) {
    return "right";
  }

  return "back";
}

export function getRupaTailSwayDegrees(pose: SkeletonPose) {
  const torso = pose.joints.torso;
  const pelvis = pose.joints.pelvis;
  const bodyLean = clampNumber((pelvis.x - torso.x) * 0.45, -16, 16);
  const leftReach = torso.x - pose.joints.leftHand.x;
  const rightReach = pose.joints.rightHand.x - torso.x;
  const reachSway = clampNumber((leftReach - rightReach) * 0.28, -22, 22);

  return clampNumber(bodyLean + reachSway, -30, 30);
}

export function getRupaCharacterTransformOptions(
  pose: SkeletonPose,
  activeControlId?: string | null,
): CharacterRigTransformOptions {
  return {
    facing: getRupaHeadFacing(pose, activeControlId),
    tailSwayDeg: getRupaTailSwayDegrees(pose),
  };
}

export function computeLimbPartAnchorPoints(
  part: CharacterRigLimbPart,
  pose: SkeletonPose,
  model: SkeletonBodyModel,
) {
  const fromBase = pose.joints[part.from];
  const toBase = pose.joints[part.to];
  const fromOffset = scaleOffset(part.fromOffset, model.scale);
  const toOffset = scaleOffset(part.toOffset, model.scale);

  return {
    from: {
      x: fromBase.x + fromOffset.x,
      y: fromBase.y + fromOffset.y,
    },
    to: {
      x: toBase.x + toOffset.x,
      y: toBase.y + toOffset.y,
    },
  };
}

export function computeLimbPartTransform(
  part: CharacterRigLimbPart,
  pose: SkeletonPose,
  model: SkeletonBodyModel,
): ComputedCharacterPartTransform {
  const { from, to } = computeLimbPartAnchorPoints(part, pose, model);
  const lengthFrom =
    part.lengthBasis === "joints" ? pose.joints[part.from] : from;
  const lengthTo = part.lengthBasis === "joints" ? pose.joints[part.to] : to;
  const jointDistance = getPointDistance(lengthFrom, lengthTo);
  const width = jointDistance * (part.lengthScale ?? 1);
  const aspectRatio = part.nativeSize.height / part.nativeSize.width;
  const height = width * aspectRatio * (part.thicknessScale ?? 1);
  const offset = scaleOffset(part.centerOffset, model.scale);
  const center = getMidpoint(from, to);

  return {
    center: {
      x: center.x + offset.x,
      y: center.y + offset.y,
    },
    height,
    id: part.id,
    opacity: part.opacity ?? 1,
    rotationDeg:
      getRotationDegrees(from, to) + (part.rotationOffsetDeg ?? 0),
    source: part.source,
    width,
    zIndex: part.zIndex,
  };
}

export function computeAnchorPartTransform(
  part: CharacterRigAnchorPart,
  pose: SkeletonPose,
  model: SkeletonBodyModel,
  options: CharacterRigTransformOptions = {},
): ComputedCharacterPartTransform {
  const anchor = pose.joints[part.anchor];
  const width = getSizeBasisValue(part.sizeBasis, model) * part.sizeMultiplier;
  const height = width * (part.nativeSize.height / part.nativeSize.width);
  const rawBaseRotationDeg = part.rotation
    ? getRotationDegrees(
        pose.joints[part.rotation.from],
        pose.joints[part.rotation.to],
      ) + (part.rotation.offsetDeg ?? 0)
    : 0;
  const baseRotationDeg = part.rotationClampDeg
    ? clampNumber(
        rawBaseRotationDeg,
        part.rotationClampDeg.min,
        part.rotationClampDeg.max,
      )
    : rawBaseRotationDeg;
  const rawSwayDeg =
    part.rotationSway?.input === "tailSwayDeg"
      ? (options.tailSwayDeg ?? 0) * (part.rotationSway.multiplier ?? 1)
      : 0;
  const swayDeg = part.rotationSway?.clampDeg
    ? clampNumber(
        rawSwayDeg,
        part.rotationSway.clampDeg.min,
        part.rotationSway.clampDeg.max,
      )
    : rawSwayDeg;
  const rotationDeg = baseRotationDeg + swayDeg;
  const offset = rotateOffset(scaleOffset(part.offset, model.scale), rotationDeg);

  return {
    center: {
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
    },
    height,
    id: part.id,
    opacity: part.opacity ?? 1,
    rotationDeg,
    source: part.source,
    width,
    zIndex: part.zIndex,
  };
}

export function sortRigPartsByZIndex<T extends { zIndex: number }>(parts: T[]) {
  return [...parts].sort((first, second) => first.zIndex - second.zIndex);
}

export function computeCharacterPartTransforms(
  parts: CharacterRigPart[],
  pose: SkeletonPose,
  model: SkeletonBodyModel,
  options: CharacterRigTransformOptions = {},
) {
  return sortRigPartsByZIndex(
    parts
      .filter((part) => isRigPartVisible(part, options))
      .map((part) =>
        part.kind === "limb"
          ? computeLimbPartTransform(part, pose, model)
          : computeAnchorPartTransform(part, pose, model, options),
      ),
  );
}
