import type { BodyProfile } from "../types/bodyProfile";
import type { SkeletonBodyModel } from "../types/skeletonPose";

const BASE_PIXELS_PER_CM = 2;
const UPPER_ARM_HEIGHT_RATIO = 0.1725;
const FOREARM_HEIGHT_RATIO = 0.1585;
const THIGH_HEIGHT_RATIO = 0.2405;
const LOWER_LEG_HEIGHT_RATIO = 0.252;

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

export function createSkeletonBodyModel(
  profile: BodyProfile,
  scale: number,
): SkeletonBodyModel {
  const clampedScale = clampSkeletonScale(scale);

  return {
    height: profile.height,
    wingspan: profile.wingspan,
    scale: clampedScale,
    headRadius: cmToViewportPoints(profile.height * 0.035, clampedScale),
    neckToTorso: cmToViewportPoints(profile.height * 0.11, clampedScale),
    torsoToPelvis: cmToViewportPoints(profile.height * 0.17, clampedScale),
    shoulderWidth: cmToViewportPoints(profile.height * 0.23, clampedScale),
    hipWidth: cmToViewportPoints(profile.height * 0.16, clampedScale),
    upperArm: cmToViewportPoints(
      profile.height * UPPER_ARM_HEIGHT_RATIO,
      clampedScale,
    ),
    forearm: cmToViewportPoints(
      profile.height * FOREARM_HEIGHT_RATIO,
      clampedScale,
    ),
    thigh: cmToViewportPoints(profile.height * THIGH_HEIGHT_RATIO, clampedScale),
    shin: cmToViewportPoints(
      profile.height * LOWER_LEG_HEIGHT_RATIO,
      clampedScale,
    ),
  };
}
