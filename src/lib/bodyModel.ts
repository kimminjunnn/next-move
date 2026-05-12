// 실제 신체 정보 cm를 받아서, 스켈레톤 계산기가 쓸 화면용 뼈 길이 모델로 바꾸는 파일

import type { BodyProfile } from "../types/bodyProfile";
import type { SkeletonBodyModel } from "../types/skeletonPose";
import { clampNumber } from "./number";

export const BASE_PIXELS_PER_CM = 2;
export const SHOULDER_WIDTH_RATIO = 0.2225;
export const HIP_WIDTH_RATIO = 0.1165;
export const UPPER_ARM_RATIO = 0.1725;
export const FOREARM_RATIO = 0.1585;
export const HAND_RATIO = 0.0575;
export const THIGH_RATIO = 0.2405;
export const SHIN_RATIO = 0.252;
const ARM_REACH_HEIGHT_RATIO_TOTAL =
  UPPER_ARM_RATIO + FOREARM_RATIO + HAND_RATIO;

export const DEFAULT_SKELETON_SCALE = 0.45;
export const MIN_SKELETON_SCALE = 0.2;
export const MAX_SKELETON_SCALE = 1.25;
export const SKELETON_SCALE_STEP = 0.05;
export const HEAD_TO_NECK_RADIUS_RATIO = 2.08;

export function clampSkeletonScale(scale: number) {
  return clampNumber(scale, MIN_SKELETON_SCALE, MAX_SKELETON_SCALE);
}

function cmToViewportPoints(value: number, scale: number) {
  return value * BASE_PIXELS_PER_CM * scale;
}

function createArmLengthsCm(profile: BodyProfile) {
  const shoulderWidth = profile.height * SHOULDER_WIDTH_RATIO;
  const oneSideReach = Math.max(1, (profile.wingspan - shoulderWidth) / 2);

  return {
    upperArm: oneSideReach * (UPPER_ARM_RATIO / ARM_REACH_HEIGHT_RATIO_TOTAL),
    forearm:
      oneSideReach *
      ((FOREARM_RATIO + HAND_RATIO) / ARM_REACH_HEIGHT_RATIO_TOTAL),
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
    headToNeck:
      cmToViewportPoints(profile.height * 0.035, clampedScale) *
      HEAD_TO_NECK_RADIUS_RATIO,
    neckToTorso: cmToViewportPoints(profile.height * 0.11, clampedScale),
    torsoToPelvis: cmToViewportPoints(profile.height * 0.17, clampedScale),
    shoulderWidth: cmToViewportPoints(
      profile.height * SHOULDER_WIDTH_RATIO,
      clampedScale,
    ),
    hipWidth: cmToViewportPoints(
      profile.height * HIP_WIDTH_RATIO,
      clampedScale,
    ),
    upperArm: cmToViewportPoints(armLengths.upperArm, clampedScale),
    forearm: cmToViewportPoints(armLengths.forearm, clampedScale),
    thigh: cmToViewportPoints(profile.height * THIGH_RATIO, clampedScale),
    shin: cmToViewportPoints(profile.height * SHIN_RATIO, clampedScale),
  };
}
