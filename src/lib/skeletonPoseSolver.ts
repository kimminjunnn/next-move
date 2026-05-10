// 스켈레톤 자세를 계산해서 풀어내는 모듈

import type { Point2D } from "../types/geometry";
import type {
  SkeletonBodyModel,
  SkeletonCoreDragInput,
  SkeletonControlJointName,
  SkeletonDragInput,
  SkeletonDragResolution,
  SkeletonDragResolutionMode,
  SkeletonEndpointName,
  SkeletonHeadDragInput,
  SkeletonJointDragInput,
  SkeletonPointName,
  SkeletonPointMap,
  SkeletonPose,
} from "../types/skeletonPose";
import { clampNumber } from "./number";
import {
  addPoints as add,
  distanceBetweenPoints as distance,
  midpoint,
  rotatePoint90 as rotate90,
  scalePoint as scaleVector,
  subtractPoints as subtract,
} from "./point2D";

const TORSO_FOLLOW_RATIO = 0.38;
const HAND_CORE_FOLLOW_RATIO = 0.86;
const HAND_CORE_RESPONSE_FULL_REACH_RATIO = 1.78;
const HAND_CORE_RESPONSE_START_REACH_RATIO = 1.35;
const HAND_CORE_VERTICAL_LUNGE_FULL_REACH_RATIO = 1.22;
const HAND_CORE_VERTICAL_LUNGE_START_REACH_RATIO = 1;
const HAND_CORE_VERTICAL_LUNGE_LOCKED_START_REACH_RATIO = 0.95;
const HAND_CORE_VERTICAL_DIRECTION_RATIO = 0.3;
const HAND_CORE_VERTICAL_LOCKED_DIRECTION_RATIO = 0.2;
const HAND_CORE_VERTICAL_SUPPORT_BIAS_RATIO = 1.5;
const HAND_CORE_HORIZONTAL_DIRECTION_RATIO = 0.58;
const HAND_CORE_HORIZONTAL_LOCKED_DIRECTION_RATIO = 0.42;
const ARM_SHOULDER_ROTATION_FOLLOW_RATIO = 0.82;
const ARM_SHOULDER_ROTATION_MAX_RADIANS = 0.58;
const ARM_SHOULDER_RESPONSE_START_REACH_RATIO = 0.82;
const LEG_CORE_ROTATION_MAX_RADIANS = 0.16;
const LEG_CORE_RESPONSE_FULL_REACH_RATIO = 1.34;
const LEG_CORE_RESPONSE_START_REACH_RATIO = 1;
const HEAD_SPINE_ROTATION_MAX_RADIANS = 0.12;
const HEAD_SPINE_FOLLOW_RATIO = 0.42;
const ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO = 0.22;
const ROOT_LIMB_CORE_RELEASE_PARALLEL_RATIO = 0.34;
const ARM_BELOW_HORIZONTAL_CORE_BLOCK_RATIO = 0.02;
const HORIZONTAL_ARM_DRAG_RATIO = 0.82;
const MIN_SOLVE_DISTANCE = 0.001;
const SKELETON_POINT_NAMES = [
  "head",
  "neck",
  "torso",
  "pelvis",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftHand",
  "rightHand",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftFoot",
  "rightFoot",
] as const satisfies readonly SkeletonPointName[];

// 0..1 반응값을 부드럽게 만들어 몸통 따라감이 갑자기 튀지 않게 한다.
function smoothStep(value: number) {
  return value * value * (3 - 2 * value);
}

function clampDistance(
  origin: Point2D,
  target: Point2D,
  maxDistance: number,
): Point2D {
  const currentDistance = distance(origin, target);

  if (currentDistance <= maxDistance || currentDistance === 0) {
    return target;
  }

  const ratio = maxDistance / currentDistance;

  return {
    x: origin.x + (target.x - origin.x) * ratio,
    y: origin.y + (target.y - origin.y) * ratio,
  };
}

function limitPointStep(
  current: Point2D,
  target: Point2D,
  maxDistance: number,
) {
  if (maxDistance <= 0) {
    return current;
  }

  return clampDistance(current, target, maxDistance);
}

// root와 target이 겹쳐서 방향을 계산할 수 없을 때, 팔꿈치/무릎을 기본적으로 어느 쪽으로 접을지 정해주는 함수
function fallbackFoldDirection(bendDirection: 1 | -1): Point2D {
  return { x: bendDirection, y: 0 };
}

// target이 너무 가까울 때, root에서 target 방향으로 최소 허용 거리만큼 떨어진 보정 좌표를 만들어 반환하는 코드
function resolveEndpointDistance(
  root: Point2D,
  target: Point2D,
  minDistance: number,
  maxDistance: number,
  bendDirection: 1 | -1,
): Point2D {
  const currentDistance = distance(root, target);

  if (currentDistance > maxDistance) {
    return clampDistance(root, target, maxDistance);
  }

  if (currentDistance >= minDistance) {
    return target;
  }

  // 여기까지 왔다는 건 target이 root에 너무 가깝다는 뜻'
  // 길이 1짜리 방향 벡터를 만드는 함수
  const direction =
    currentDistance > MIN_SOLVE_DISTANCE
      ? scaleVector(subtract(target, root), 1 / currentDistance)
      : fallbackFoldDirection(bendDirection);

  return add(root, scaleVector(direction, minDistance));
}

// 시작점(root)과 끝점(target)을 주면, 길이가 고정된 뼈 2개를 사용해서 중간 관절(joint) 위치와 실제 끝점(endpoint)을 계산하는 함수
function solveTwoBoneJoint(
  root: Point2D,
  target: Point2D,
  firstLength: number,
  secondLength: number,
  bendDirection: 1 | -1,
): { joint: Point2D; endpoint: Point2D } {
  const maxReach = firstLength + secondLength;
  const minReach = Math.abs(firstLength - secondLength);
  const endpoint = resolveEndpointDistance(
    root,
    target,
    minReach,
    maxReach,
    bendDirection,
  );
  const rootToEndpointVector = subtract(endpoint, root);
  const rootToEndpointDistance = distance(root, endpoint);

  // root와 endpoint가 거의 같은 점이면 특수 처리하고 바로 return
  if (rootToEndpointDistance < MIN_SOLVE_DISTANCE) {
    const direction = fallbackFoldDirection(bendDirection);

    return {
      joint: add(root, scaleVector(direction, firstLength)),
      endpoint,
    };
  }

  // root와 endpoint를 잇는 선 위에서 joint의 기준점(base)을 찾고, 그 기준점에서 수직 방향으로 height만큼 올려서 joint 좌표를 계산.
  const alongDistance =
    (firstLength * firstLength -
      secondLength * secondLength +
      rootToEndpointDistance * rootToEndpointDistance) /
    (2 * rootToEndpointDistance);
  const height = Math.sqrt(
    Math.max(0, firstLength * firstLength - alongDistance * alongDistance),
  );
  const unit = scaleVector(rootToEndpointVector, 1 / rootToEndpointDistance);
  const base = add(root, scaleVector(unit, alongDistance));
  const perpendicular = rotate90(unit, bendDirection);

  return {
    joint: add(base, scaleVector(perpendicular, height)),
    endpoint,
  };
}

export function createDefaultSkeletonPose(
  model: SkeletonBodyModel,
  viewportWidth: number,
  viewportHeight: number,
): SkeletonPose {
  const center = { x: viewportWidth / 2, y: viewportHeight / 2 };
  const torso = { x: center.x, y: center.y - model.torsoToPelvis * 0.35 };
  const pelvis = { x: center.x, y: torso.y + model.torsoToPelvis };
  const neck = { x: center.x, y: torso.y - model.neckToTorso };
  const leftShoulder = { x: neck.x - model.shoulderWidth / 2, y: neck.y + 8 };
  const rightShoulder = { x: neck.x + model.shoulderWidth / 2, y: neck.y + 8 };
  const leftHip = { x: pelvis.x - model.hipWidth / 2, y: pelvis.y };
  const rightHip = { x: pelvis.x + model.hipWidth / 2, y: pelvis.y };
  const armReach = model.upperArm + model.forearm;
  const legReach = model.thigh + model.shin;
  const defaultLeftArmTarget = {
    x: leftShoulder.x - armReach * 0.72,
    y: leftShoulder.y - armReach * 0.5,
  };
  const defaultRightArmTarget = {
    x: rightShoulder.x + armReach * 0.5,
    y: rightShoulder.y - armReach * 0.4,
  };
  const defaultLeftLegTarget = {
    x: leftHip.x - legReach * 0.3,
    y: leftHip.y + legReach * 0.74,
  };
  const defaultRightLegTarget = {
    x: rightHip.x + legReach * 0.21,
    y: rightHip.y + legReach,
  };

  const leftArm = solveTwoBoneJoint(
    leftShoulder,
    defaultLeftArmTarget,
    model.upperArm,
    model.forearm,
    -1,
  );
  const rightArm = solveTwoBoneJoint(
    rightShoulder,
    defaultRightArmTarget,
    model.upperArm,
    model.forearm,
    1,
  );
  const leftLeg = solveTwoBoneJoint(
    leftHip,
    defaultLeftLegTarget,
    model.thigh,
    model.shin,
    1,
  );
  const rightLeg = solveTwoBoneJoint(
    rightHip,
    defaultRightLegTarget,
    model.thigh,
    model.shin,
    1,
  );

  return {
    joints: {
      head: { x: neck.x, y: neck.y - model.headRadius * 1.55 },
      neck,
      torso,
      pelvis,
      leftShoulder,
      rightShoulder,
      leftElbow: leftArm.joint,
      rightElbow: rightArm.joint,
      leftHand: leftArm.endpoint,
      rightHand: rightArm.endpoint,
      leftHip,
      rightHip,
      leftKnee: leftLeg.joint,
      rightKnee: rightLeg.joint,
      leftFoot: leftLeg.endpoint,
      rightFoot: rightLeg.endpoint,
    },
  };
}

function getEndpointRootName(endpointName: SkeletonEndpointName) {
  switch (endpointName) {
    case "leftHand":
      return "leftShoulder";
    case "rightHand":
      return "rightShoulder";
    case "leftFoot":
      return "leftHip";
    case "rightFoot":
      return "rightHip";
  }
}

function getEndpointJointName(endpointName: SkeletonEndpointName) {
  switch (endpointName) {
    case "leftHand":
      return "leftElbow";
    case "rightHand":
      return "rightElbow";
    case "leftFoot":
      return "leftKnee";
    case "rightFoot":
      return "rightKnee";
  }
}

function limbLengths(
  model: SkeletonBodyModel,
  endpointName: SkeletonEndpointName,
) {
  if (endpointName === "leftHand" || endpointName === "rightHand") {
    return { first: model.upperArm, second: model.forearm };
  }

  return { first: model.thigh, second: model.shin };
}

function bendDirection(endpointName: SkeletonEndpointName): 1 | -1 {
  switch (endpointName) {
    case "leftHand":
      return -1;
    case "rightHand":
      return 1;
    case "leftFoot":
      return 1;
    case "rightFoot":
      return -1;
  }
}

function getJointEndpointName(
  jointName: SkeletonControlJointName,
): SkeletonEndpointName {
  switch (jointName) {
    case "leftElbow":
      return "leftHand";
    case "rightElbow":
      return "rightHand";
    case "leftKnee":
      return "leftFoot";
    case "rightKnee":
      return "rightFoot";
  }
}

function normalizeOrFallback(
  vector: Point2D,
  fallbackDirection: 1 | -1,
): Point2D {
  const vectorDistance = distance({ x: 0, y: 0 }, vector);

  if (vectorDistance <= MIN_SOLVE_DISTANCE) {
    return fallbackFoldDirection(fallbackDirection);
  }

  return scaleVector(vector, 1 / vectorDistance);
}

function currentBendDirection(
  root: Point2D,
  joint: Point2D,
  endpoint: Point2D,
  fallbackDirection: 1 | -1,
): 1 | -1 {
  const rootToEndpoint = subtract(endpoint, root);
  const endpointDistance = distance(root, endpoint);

  if (endpointDistance <= MIN_SOLVE_DISTANCE) {
    return fallbackDirection;
  }

  const unit = scaleVector(rootToEndpoint, 1 / endpointDistance);
  const side = rotate90(unit, 1);
  const rootToJoint = subtract(joint, root);
  const signedDistance = rootToJoint.x * side.x + rootToJoint.y * side.y;

  if (Math.abs(signedDistance) <= MIN_SOLVE_DISTANCE) {
    return fallbackDirection;
  }

  return signedDistance > 0 ? 1 : -1;
}

function shiftCore(
  joints: SkeletonPointMap,
  delta: Point2D,
): SkeletonPointMap {
  const shifted = { ...joints };
  const coreIds = [
    "head",
    "neck",
    "torso",
    "pelvis",
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
  ] as const;

  coreIds.forEach((jointName) => {
    shifted[jointName] = add(shifted[jointName], delta);
  });

  return shifted;
}

function rotatePointAround(
  point: Point2D,
  center: Point2D,
  angle: number,
): Point2D {
  const translated = subtract(point, center);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: center.x + translated.x * cos - translated.y * sin,
    y: center.y + translated.x * sin + translated.y * cos,
  };
}

function rotateCore(
  joints: SkeletonPointMap,
  angle: number,
): SkeletonPointMap {
  if (Math.abs(angle) <= MIN_SOLVE_DISTANCE) {
    return joints;
  }

  const rotated = { ...joints };
  const center = getSkeletonCenter({ joints });
  const coreIds = [
    "head",
    "neck",
    "torso",
    "pelvis",
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
  ] as const;

  coreIds.forEach((jointName) => {
    rotated[jointName] = rotatePointAround(rotated[jointName], center, angle);
  });

  return rotated;
}

function rotateUpperCore(
  joints: SkeletonPointMap,
  angle: number,
): SkeletonPointMap {
  if (Math.abs(angle) <= MIN_SOLVE_DISTANCE) {
    return joints;
  }

  const rotated = { ...joints };
  const upperIds = [
    "head",
    "neck",
    "torso",
    "leftShoulder",
    "rightShoulder",
  ] as const;

  upperIds.forEach((jointName) => {
    rotated[jointName] = rotatePointAround(
      rotated[jointName],
      rotated.pelvis,
      angle,
    );
  });

  return rotated;
}

function angleBetweenVectors(from: Point2D, to: Point2D) {
  const cross = from.x * to.y - from.y * to.x;
  const dot = from.x * to.x + from.y * to.y;

  return Math.atan2(cross, dot);
}

function isParallelToRootLimbDrag(
  root: Point2D,
  joint: Point2D,
  target: Point2D,
  maxParallelRatio = ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO,
) {
  const rootLimbVector = subtract(joint, root);
  const dragVector = subtract(target, joint);
  const rootLimbDistance = distance({ x: 0, y: 0 }, rootLimbVector);
  const dragDistance = distance({ x: 0, y: 0 }, dragVector);

  if (
    rootLimbDistance <= MIN_SOLVE_DISTANCE ||
    dragDistance <= MIN_SOLVE_DISTANCE
  ) {
    return false;
  }

  const cross = Math.abs(
    rootLimbVector.x * dragVector.y - rootLimbVector.y * dragVector.x,
  );
  const parallelRatio = cross / (rootLimbDistance * dragDistance);

  return parallelRatio < maxParallelRatio;
}

function dotVectors(a: Point2D, b: Point2D) {
  return a.x * b.x + a.y * b.y;
}

function isHorizontalDrag(vector: Point2D) {
  const totalDistance = Math.abs(vector.x) + Math.abs(vector.y);

  if (totalDistance <= MIN_SOLVE_DISTANCE) {
    return false;
  }

  return Math.abs(vector.x) / totalDistance >= HORIZONTAL_ARM_DRAG_RATIO;
}

function isBelowHorizontalArmDrag(
  root: Point2D,
  endpoint: Point2D,
  target: Point2D,
) {
  const armVector = subtract(endpoint, root);
  const dragVector = subtract(target, endpoint);
  const armDistance = distance(root, endpoint);

  if (armDistance <= MIN_SOLVE_DISTANCE) {
    return false;
  }

  return (
    armVector.y / armDistance > ARM_BELOW_HORIZONTAL_CORE_BLOCK_RATIO &&
    isHorizontalDrag(dragVector)
  );
}

function isHandEndpoint(endpointName: SkeletonEndpointName) {
  return endpointName === "leftHand" || endpointName === "rightHand";
}

function isFootEndpoint(endpointName: SkeletonEndpointName) {
  return endpointName === "leftFoot" || endpointName === "rightFoot";
}

function isStraightEndpointPullAway(
  root: Point2D,
  endpoint: Point2D,
  target: Point2D,
  maxReach: number,
) {
  if (
    distance(root, endpoint) < maxReach * 0.98 ||
    !isParallelToRootLimbDrag(root, endpoint, target)
  ) {
    return false;
  }

  return dotVectors(subtract(target, endpoint), subtract(endpoint, root)) > 0;
}

function oppositeFootEndpointName(
  endpointName: SkeletonEndpointName,
): SkeletonEndpointName | null {
  switch (endpointName) {
    case "leftHand":
      return "rightFoot";
    case "rightHand":
      return "leftFoot";
    default:
      return null;
  }
}

function maxAnchoredShiftDistance(
  anchorRoot: Point2D,
  anchorEndpoint: Point2D,
  direction: Point2D,
  anchorMaxReach: number,
) {
  const anchorRootToEndpoint = subtract(anchorRoot, anchorEndpoint);
  const projectedDistance =
    anchorRootToEndpoint.x * direction.x + anchorRootToEndpoint.y * direction.y;
  const currentAnchorDistance = distance(anchorRoot, anchorEndpoint);
  const remainingReach =
    anchorMaxReach * anchorMaxReach -
    currentAnchorDistance * currentAnchorDistance;

  if (remainingReach <= MIN_SOLVE_DISTANCE) {
    return 0;
  }

  const discriminant =
    projectedDistance * projectedDistance + Math.max(0, remainingReach);

  return Math.max(0, -projectedDistance + Math.sqrt(discriminant));
}

function resolveHandCoreShift(
  endpointName: SkeletonEndpointName,
  movingRoot: Point2D,
  joints: SkeletonPointMap,
  target: Point2D,
  rootMaxReach: number,
  model: SkeletonBodyModel,
  previousMode?: SkeletonDragResolutionMode | null,
): Point2D {
  const isLockedCoreDrag = previousMode === "core";
  const targetDistance = distance(movingRoot, target);
  const overflow = Math.max(0, targetDistance - rootMaxReach);
  const targetVector = subtract(target, movingRoot);
  const directionalDistance =
    Math.abs(targetVector.x) + Math.abs(targetVector.y);
  const horizontalRatio =
    directionalDistance > MIN_SOLVE_DISTANCE
      ? Math.abs(targetVector.x) / directionalDistance
      : 0;
  const verticalRatio =
    targetVector.y < 0 && directionalDistance > MIN_SOLVE_DISTANCE
      ? Math.abs(targetVector.y) / directionalDistance
      : 0;

  if (overflow <= MIN_SOLVE_DISTANCE || targetDistance <= MIN_SOLVE_DISTANCE) {
    return { x: 0, y: 0 };
  }

  const reachRatio = targetDistance / rootMaxReach;
  const verticalDirectionRatio = isLockedCoreDrag
    ? HAND_CORE_VERTICAL_LOCKED_DIRECTION_RATIO
    : HAND_CORE_VERTICAL_DIRECTION_RATIO;
  const horizontalDirectionRatio = isLockedCoreDrag
    ? HAND_CORE_HORIZONTAL_LOCKED_DIRECTION_RATIO
    : HAND_CORE_HORIZONTAL_DIRECTION_RATIO;
  const isVerticalLunge = verticalRatio >= verticalDirectionRatio;
  const verticalStartReachRatio = isLockedCoreDrag
    ? HAND_CORE_VERTICAL_LUNGE_LOCKED_START_REACH_RATIO
    : HAND_CORE_VERTICAL_LUNGE_START_REACH_RATIO;
  const reachEffort = smoothStep(
    clampNumber(
      (reachRatio -
        (isVerticalLunge
          ? verticalStartReachRatio
          : HAND_CORE_RESPONSE_START_REACH_RATIO)) /
        (isVerticalLunge
          ? HAND_CORE_VERTICAL_LUNGE_FULL_REACH_RATIO -
            HAND_CORE_VERTICAL_LUNGE_START_REACH_RATIO
          : HAND_CORE_RESPONSE_FULL_REACH_RATIO -
            HAND_CORE_RESPONSE_START_REACH_RATIO),
      0,
      1,
    ),
  );

  if (reachEffort <= MIN_SOLVE_DISTANCE) {
    return { x: 0, y: 0 };
  }

  const direction = scaleVector(targetVector, 1 / targetDistance);
  const anchorEndpointNames =
    verticalRatio >= verticalDirectionRatio
      ? (["leftFoot", "rightFoot"] as const)
      : horizontalRatio >= horizontalDirectionRatio
        ? ([oppositeFootEndpointName(endpointName)].filter(
            Boolean,
          ) as SkeletonEndpointName[])
        : [];

  if (anchorEndpointNames.length === 0) {
    return { x: 0, y: 0 };
  }

  const anchorShiftDistances = anchorEndpointNames.map(
    (anchorEndpointName) => {
      const anchorRootName = getEndpointRootName(anchorEndpointName);
      const lengths = limbLengths(model, anchorEndpointName);

      return maxAnchoredShiftDistance(
        joints[anchorRootName],
        joints[anchorEndpointName],
        direction,
        lengths.first + lengths.second,
      );
    },
  );
  const availableAnchorShiftDistances = anchorShiftDistances.filter(
    (shiftDistance) => shiftDistance > MIN_SOLVE_DISTANCE,
  );
  const strongestAnchorShiftDistance =
    availableAnchorShiftDistances.length > 0
      ? Math.max(...availableAnchorShiftDistances)
      : 0;
  const weakestAnchorShiftDistance =
    availableAnchorShiftDistances.length > 0
      ? Math.min(...availableAnchorShiftDistances)
      : 0;
  const hasDominantVerticalSupport =
    isVerticalLunge &&
    strongestAnchorShiftDistance > 0 &&
    (availableAnchorShiftDistances.length < anchorShiftDistances.length ||
      strongestAnchorShiftDistance >=
        weakestAnchorShiftDistance * HAND_CORE_VERTICAL_SUPPORT_BIAS_RATIO);
  const maxShiftDistance = hasDominantVerticalSupport
    ? strongestAnchorShiftDistance
    : Math.min(...anchorShiftDistances);
  const shiftDistance = Math.min(
    overflow * (isVerticalLunge ? 1 : HAND_CORE_FOLLOW_RATIO) * reachEffort,
    maxShiftDistance,
  );

  return scaleVector(direction, shiftDistance);
}

function resolveCoreRotationAngle(
  endpointName: SkeletonEndpointName,
  root: Point2D,
  target: Point2D,
  maxReach: number,
  reachEffort: number,
) {
  const horizontalReachRatio = clampNumber(
    Math.abs(target.x - root.x) / maxReach,
    0,
    1,
  );
  const isFoot = endpointName === "leftFoot" || endpointName === "rightFoot";
  const isHand = endpointName === "leftHand" || endpointName === "rightHand";

  if (isFoot) {
    const leanDirection = target.x >= root.x ? -1 : 1;

    return (
      leanDirection *
      LEG_CORE_ROTATION_MAX_RADIANS *
      reachEffort *
      horizontalReachRatio
    );
  }

  if (isHand) {
    return 0;
  }

  return 0;
}

function resolveCoreReachEffort(targetDistance: number, maxReach: number) {
  const rawEffort =
    (targetDistance - maxReach * LEG_CORE_RESPONSE_START_REACH_RATIO) /
    (maxReach *
      (LEG_CORE_RESPONSE_FULL_REACH_RATIO -
        LEG_CORE_RESPONSE_START_REACH_RATIO));

  return smoothStep(clampNumber(rawEffort, 0, 1));
}

function resolveShoulderReach(
  shoulder: Point2D,
  neck: Point2D,
  target: Point2D,
  maxReach: number,
): Point2D {
  const targetDistance = distance(shoulder, target);
  const startDistance = maxReach * ARM_SHOULDER_RESPONSE_START_REACH_RATIO;

  if (targetDistance <= startDistance) {
    return shoulder;
  }

  const effort = smoothStep(
    clampNumber(
      (targetDistance - startDistance) / (maxReach - startDistance),
      0,
      1,
    ),
  );
  const shoulderDirection = subtract(shoulder, neck);
  const targetDirection = subtract(target, neck);
  const rotation = clampNumber(
    angleBetweenVectors(shoulderDirection, targetDirection) *
      ARM_SHOULDER_ROTATION_FOLLOW_RATIO *
      effort,
    -ARM_SHOULDER_ROTATION_MAX_RADIANS,
    ARM_SHOULDER_ROTATION_MAX_RADIANS,
  );

  return rotatePointAround(shoulder, neck, rotation);
}

function resolveRestingLimbs(
  joints: SkeletonPointMap,
  model: SkeletonBodyModel,
  draggedEndpointName: SkeletonEndpointName,
): SkeletonPointMap {
  const resolved = { ...joints };
  const endpoints: SkeletonEndpointName[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  endpoints.forEach((endpointName) => {
    if (endpointName === draggedEndpointName) {
      return;
    }

    const rootName = getEndpointRootName(endpointName);
    const jointName = getEndpointJointName(endpointName);
    const lengths = limbLengths(model, endpointName);
    const solved = solveTwoBoneJoint(
      resolved[rootName],
      resolved[endpointName],
      lengths.first,
      lengths.second,
      currentBendDirection(
        resolved[rootName],
        resolved[jointName],
        resolved[endpointName],
        bendDirection(endpointName),
      ),
    );

    resolved[jointName] = solved.joint;
    resolved[endpointName] = solved.endpoint;
  });

  return resolved;
}

function resolveAnchoredLimbs(
  shiftedCoreJoints: SkeletonPointMap,
  anchorJoints: SkeletonPointMap,
  model: SkeletonBodyModel,
): SkeletonPointMap {
  const resolved = { ...shiftedCoreJoints };
  const endpoints: SkeletonEndpointName[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  endpoints.forEach((endpointName) => {
    const rootName = getEndpointRootName(endpointName);
    const jointName = getEndpointJointName(endpointName);
    const lengths = limbLengths(model, endpointName);
    const solved = solveTwoBoneJoint(
      resolved[rootName],
      anchorJoints[endpointName],
      lengths.first,
      lengths.second,
      currentBendDirection(
        anchorJoints[rootName],
        anchorJoints[jointName],
        anchorJoints[endpointName],
        bendDirection(endpointName),
      ),
    );

    resolved[jointName] = solved.joint;
    resolved[endpointName] = solved.endpoint;
  });

  return resolved;
}

export function resolveSkeletonPoseDragWithMode(
  pose: SkeletonPose,
  input: SkeletonDragInput,
  model: SkeletonBodyModel,
): SkeletonDragResolution {
  const rootName = getEndpointRootName(input.endpointName);
  const jointName = getEndpointJointName(input.endpointName);
  const lengths = limbLengths(model, input.endpointName);
  const maxReach = lengths.first + lengths.second;
  const root = pose.joints[rootName];
  const targetDistance = distance(root, input.target);
  const isHand = isHandEndpoint(input.endpointName);
  const isFoot = isFootEndpoint(input.endpointName);

  const reachEffort = isHand
    ? 0
    : isFoot &&
        isStraightEndpointPullAway(
          root,
          pose.joints[input.endpointName],
          input.target,
          maxReach,
        )
      ? 0
      : resolveCoreReachEffort(targetDistance, maxReach);
  const overflow = Math.max(0, targetDistance - maxReach);
  const coreShift = isHand
    ? resolveHandCoreShift(
        input.endpointName,
        root,
        pose.joints,
        input.target,
        maxReach,
        model,
        input.previousMode,
      )
    : targetDistance > 0 && reachEffort > 0
      ? scaleVector(
          subtract(input.target, root),
          (overflow / targetDistance) * TORSO_FOLLOW_RATIO * reachEffort,
        )
      : { x: 0, y: 0 };
  const coreRotationAngle = resolveCoreRotationAngle(
    input.endpointName,
    root,
    input.target,
    maxReach,
    reachEffort,
  );
  const shiftedJoints = isHand
    ? shiftCore(rotateUpperCore(pose.joints, coreRotationAngle), coreShift)
    : rotateCore(shiftCore(pose.joints, coreShift), coreRotationAngle);
  const rootedJoints: SkeletonPointMap = isHand
    ? {
        ...shiftedJoints,
        [rootName]: resolveShoulderReach(
          shiftedJoints[rootName],
          shiftedJoints.neck,
          input.target,
          maxReach,
        ),
      }
    : shiftedJoints;
  const solveTarget =
    isHand && distance(rootedJoints[rootName], input.target) > maxReach
      ? clampDistance(rootedJoints[rootName], input.target, maxReach)
      : input.target;
  const solved = solveTwoBoneJoint(
    rootedJoints[rootName],
    solveTarget,
    lengths.first,
    lengths.second,
    currentBendDirection(
      rootedJoints[rootName],
      rootedJoints[jointName],
      rootedJoints[input.endpointName],
      bendDirection(input.endpointName),
    ),
  );
  const nextJoints: SkeletonPointMap = {
    ...rootedJoints,
    [jointName]: solved.joint,
    [input.endpointName]: solved.endpoint,
  };

  return {
    pose: {
      joints: resolveRestingLimbs(nextJoints, model, input.endpointName),
    },
    mode:
      distance({ x: 0, y: 0 }, coreShift) > MIN_SOLVE_DISTANCE
        ? "core"
        : "pose",
  };
}

export function resolveSkeletonPoseDrag(
  pose: SkeletonPose,
  input: SkeletonDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  return resolveSkeletonPoseDragWithMode(pose, input, model).pose;
}

export function resolveSkeletonJointDragWithMode(
  pose: SkeletonPose,
  input: SkeletonJointDragInput,
  model: SkeletonBodyModel,
): SkeletonDragResolution {
  const endpointName = getJointEndpointName(input.jointName);
  const rootName = getEndpointRootName(endpointName);
  const lengths = limbLengths(model, endpointName);
  const maxParallelRatio =
    input.previousMode === "core"
      ? ROOT_LIMB_CORE_RELEASE_PARALLEL_RATIO
      : ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO;
  const coreDragAllowed = input.coreDragAllowed !== false;
  const isBlockedBelowHorizontalArmDrag =
    isHandEndpoint(endpointName) &&
    isBelowHorizontalArmDrag(
      pose.joints[rootName],
      pose.joints[input.jointName],
      input.target,
    );

  if (
    coreDragAllowed &&
    !isBlockedBelowHorizontalArmDrag &&
    isParallelToRootLimbDrag(
      pose.joints[rootName],
      pose.joints[input.jointName],
      input.target,
      maxParallelRatio,
    )
  ) {
    return {
      pose: resolveSkeletonCoreDrag(
        pose,
        {
          delta: subtract(input.target, pose.joints[input.jointName]),
        },
        model,
      ),
      mode: "core",
    };
  }

  const direction = normalizeOrFallback(
    subtract(input.target, pose.joints[rootName]),
    bendDirection(endpointName),
  );
  const joint = add(
    pose.joints[rootName],
    scaleVector(direction, lengths.first),
  );
  const endpointDirection = normalizeOrFallback(
    subtract(pose.joints[endpointName], joint),
    bendDirection(endpointName),
  );
  const endpoint = add(joint, scaleVector(endpointDirection, lengths.second));
  const nextJoints: SkeletonPointMap = {
    ...pose.joints,
    [input.jointName]: joint,
    [endpointName]: endpoint,
  };

  return {
    pose: {
      joints: resolveRestingLimbs(nextJoints, model, endpointName),
    },
    mode: "pose",
  };
}

export function resolveSkeletonJointDrag(
  pose: SkeletonPose,
  input: SkeletonJointDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  return resolveSkeletonJointDragWithMode(pose, input, model).pose;
}

export function resolveSkeletonCoreDrag(
  pose: SkeletonPose,
  input: SkeletonCoreDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  return {
    joints: resolveAnchoredLimbs(
      shiftCore(pose.joints, input.delta),
      pose.joints,
      model,
    ),
  };
}

export function resolveSkeletonBodyDrag(
  pose: SkeletonPose,
  input: SkeletonCoreDragInput,
  model: SkeletonBodyModel,
  mode: "calibrating" | "simulating",
): SkeletonPose {
  if (mode === "calibrating") {
    return translateSkeletonPose(pose, input.delta);
  }

  return resolveSkeletonCoreDrag(pose, input, model);
}

export function resolveSkeletonHeadDrag(
  pose: SkeletonPose,
  input: SkeletonHeadDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  const headToNeckDistance = model.headRadius * 1.55;
  const currentHeadDirection = normalizeOrFallback(
    subtract(pose.joints.head, pose.joints.neck),
    -1,
  );
  const spineDirection = normalizeOrFallback(
    subtract(pose.joints.neck, pose.joints.pelvis),
    -1,
  );
  const targetSpineDirection = normalizeOrFallback(
    subtract(input.target, pose.joints.pelvis),
    -1,
  );
  const spineRotation = clampNumber(
    angleBetweenVectors(spineDirection, targetSpineDirection) *
      HEAD_SPINE_FOLLOW_RATIO,
    -HEAD_SPINE_ROTATION_MAX_RADIANS,
    HEAD_SPINE_ROTATION_MAX_RADIANS,
  );
  const shiftedJoints = rotateUpperCore(pose.joints, spineRotation);
  const headDirection = normalizeOrFallback(
    subtract(input.target, shiftedJoints.neck),
    currentHeadDirection.x >= 0 ? 1 : -1,
  );
  const nextJoints: SkeletonPointMap = {
    ...shiftedJoints,
    head: add(
      shiftedJoints.neck,
      scaleVector(headDirection, headToNeckDistance),
    ),
  };

  return {
    joints: resolveAnchoredLimbs(nextJoints, pose.joints, model),
  };
}

export function limitSkeletonPoseStep(
  currentPose: SkeletonPose,
  targetPose: SkeletonPose,
  maxJointDistance: number,
): SkeletonPose {
  const joints = { ...targetPose.joints };

  SKELETON_POINT_NAMES.forEach((pointName) => {
    joints[pointName] = limitPointStep(
      currentPose.joints[pointName],
      targetPose.joints[pointName],
      maxJointDistance,
    );
  });

  return { joints };
}

export function limitSkeletonPoseStepWithModel(
  currentPose: SkeletonPose,
  targetPose: SkeletonPose,
  maxJointDistance: number,
  model: SkeletonBodyModel,
): SkeletonPose {
  const limitedPose = limitSkeletonPoseStep(
    currentPose,
    targetPose,
    maxJointDistance,
  );
  const projectedPose = {
    joints: resolveAnchoredLimbs(limitedPose.joints, limitedPose.joints, model),
  };

  return limitSkeletonPoseStep(currentPose, projectedPose, maxJointDistance);
}

export function translateSkeletonPose(
  pose: SkeletonPose,
  delta: Point2D,
): SkeletonPose {
  const translatedJoints = Object.entries(
    pose.joints,
  ).reduce<SkeletonPointMap>(
    (nextJoints, [jointName, point]) => ({
      ...nextJoints,
      [jointName]: add(point, delta),
    }),
    {} as SkeletonPointMap,
  );

  return {
    joints: translatedJoints,
  };
}

export function getEndpointPosition(
  pose: SkeletonPose,
  endpointName: SkeletonEndpointName,
): Point2D {
  return pose.joints[endpointName];
}

export function getSkeletonCenter(pose: SkeletonPose): Point2D {
  return midpoint(pose.joints.torso, pose.joints.pelvis);
}
