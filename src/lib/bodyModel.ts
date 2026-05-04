import type { BodyProfile } from "../types/bodyProfile";
import type { SkeletonBodyModel } from "../types/skeletonPose";

const BASE_PIXELS_PER_CM = 2;
const UPPER_ARM_HEIGHT_RATIO = 0.1725;
const FOREARM_HEIGHT_RATIO = 0.1585;
const HAND_HEIGHT_RATIO = 0.0575;
const THIGH_HEIGHT_RATIO = 0.2405;
const LOWER_LEG_HEIGHT_RATIO = 0.252;
const SHOULDER_WIDTH_HEIGHT_RATIO = 0.23;
const HIP_WIDTH_HEIGHT_RATIO = 0.16;
const ARM_REACH_HEIGHT_RATIO_TOTAL =
  UPPER_ARM_HEIGHT_RATIO + FOREARM_HEIGHT_RATIO + HAND_HEIGHT_RATIO;

export const DEFAULT_SKELETON_SCALE = 0.45;
export const MIN_SKELETON_SCALE = 0.2;
export const MAX_SKELETON_SCALE = 1.25;
export const SKELETON_SCALE_STEP = 0.05;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampSkeletonScale(scale: number) {
  return clamp(scale, MIN_SKELETON_SCALE, MAX_SKELETON_SCALE);
}

function cmToViewportPoints(value: number, scale: number) {
  return value * BASE_PIXELS_PER_CM * scale;
}

function createArmLengthsCm(profile: BodyProfile) {
  const shoulderWidth = profile.height * SHOULDER_WIDTH_HEIGHT_RATIO;
  const oneSideReach = Math.max(1, (profile.wingspan - shoulderWidth) / 2);

  return {
    upperArm:
      oneSideReach * (UPPER_ARM_HEIGHT_RATIO / ARM_REACH_HEIGHT_RATIO_TOTAL),
    forearm:
      oneSideReach *
      ((FOREARM_HEIGHT_RATIO + HAND_HEIGHT_RATIO) /
        ARM_REACH_HEIGHT_RATIO_TOTAL),
  };
}

export function createSkeletonBodyModel(
  profile: BodyProfile,
  scale: number,
): SkeletonBodyModel {
  const clampedScale = clampSkeletonScale(scale);
  const armLengths = createArmLengthsCm(profile);

  return {
    height: profile.height,
    wingspan: profile.wingspan,
    scale: clampedScale,
    headRadius: cmToViewportPoints(profile.height * 0.035, clampedScale),
    neckToTorso: cmToViewportPoints(profile.height * 0.11, clampedScale),
    torsoToPelvis: cmToViewportPoints(profile.height * 0.17, clampedScale),
    shoulderWidth: cmToViewportPoints(
      profile.height * SHOULDER_WIDTH_HEIGHT_RATIO,
      clampedScale,
    ),
    hipWidth: cmToViewportPoints(
      profile.height * HIP_WIDTH_HEIGHT_RATIO,
      clampedScale,
    ),
    upperArm: cmToViewportPoints(armLengths.upperArm, clampedScale),
    forearm: cmToViewportPoints(armLengths.forearm, clampedScale),
    thigh: cmToViewportPoints(profile.height * THIGH_HEIGHT_RATIO, clampedScale),
    shin: cmToViewportPoints(
      profile.height * LOWER_LEG_HEIGHT_RATIO,
      clampedScale,
    ),
  };
}
