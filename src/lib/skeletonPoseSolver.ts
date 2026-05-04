import type { SimulationPoint } from "../types/simulation";
import type {
  SkeletonBodyModel,
  SkeletonCoreDragInput,
  SkeletonControlJointId,
  SkeletonDragInput,
  SkeletonDragResolution,
  SkeletonDragResolutionMode,
  SkeletonEndpointId,
  SkeletonHeadDragInput,
  SkeletonJointDragInput,
  SkeletonJointMap,
  SkeletonPose,
  SkeletonStraightCoreDragState,
} from "../types/skeletonPose";

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
const STRAIGHT_CORE_DRAG_REACH_RATIO = 0.98;
const STRAIGHT_CORE_DRAG_PROMOTE_DISTANCE = 10;
const MIN_SOLVE_DISTANCE = 0.001;
const SKELETON_JOINT_IDS = [
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
] as const;

function add(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scaleVector(point: SimulationPoint, scale: number): SimulationPoint {
  return { x: point.x * scale, y: point.y * scale };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothStep(value: number) {
  return value * value * (3 - 2 * value);
}

function distance(a: SimulationPoint, b: SimulationPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampDistance(
  origin: SimulationPoint,
  target: SimulationPoint,
  maxDistance: number,
): SimulationPoint {
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
  current: SimulationPoint,
  target: SimulationPoint,
  maxDistance: number,
) {
  if (maxDistance <= 0) {
    return current;
  }

  return clampDistance(current, target, maxDistance);
}

function midpoint(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function rotate90(point: SimulationPoint, direction: 1 | -1): SimulationPoint {
  return {
    x: -point.y * direction,
    y: point.x * direction,
  };
}

function fallbackFoldDirection(bendDirection: 1 | -1): SimulationPoint {
  return { x: bendDirection, y: 0 };
}

function resolveEndpointDistance(
  root: SimulationPoint,
  target: SimulationPoint,
  minDistance: number,
  maxDistance: number,
  bendDirection: 1 | -1,
): SimulationPoint {
  const currentDistance = distance(root, target);

  if (currentDistance > maxDistance) {
    return clampDistance(root, target, maxDistance);
  }

  if (currentDistance >= minDistance) {
    return target;
  }

  const direction =
    currentDistance > MIN_SOLVE_DISTANCE
      ? scaleVector(subtract(target, root), 1 / currentDistance)
      : fallbackFoldDirection(bendDirection);

  return add(root, scaleVector(direction, minDistance));
}

function solveTwoBoneJoint(
  root: SimulationPoint,
  target: SimulationPoint,
  firstLength: number,
  secondLength: number,
  bendDirection: 1 | -1,
): { joint: SimulationPoint; endpoint: SimulationPoint } {
  const maxReach = firstLength + secondLength;
  const minReach = Math.abs(firstLength - secondLength);
  const endpoint = resolveEndpointDistance(
    root,
    target,
    minReach,
    maxReach,
    bendDirection,
  );
  const rootToEndpoint = subtract(endpoint, root);
  const rawEndpointDistance = distance(root, endpoint);

  if (rawEndpointDistance < MIN_SOLVE_DISTANCE) {
    const direction = fallbackFoldDirection(bendDirection);

    return {
      joint: add(root, scaleVector(direction, firstLength)),
      endpoint,
    };
  }

  const endpointDistance = rawEndpointDistance;
  const alongDistance =
    (firstLength * firstLength -
      secondLength * secondLength +
      endpointDistance * endpointDistance) /
    (2 * endpointDistance);
  const height = Math.sqrt(
    Math.max(0, firstLength * firstLength - alongDistance * alongDistance),
  );
  const unit = scaleVector(rootToEndpoint, 1 / endpointDistance);
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

  const leftArm = solveTwoBoneJoint(
    leftShoulder,
    {
      x: leftShoulder.x,
      y: leftShoulder.y + model.upperArm + model.forearm,
    },
    model.upperArm,
    model.forearm,
    -1,
  );
  const rightArm = solveTwoBoneJoint(
    rightShoulder,
    {
      x: rightShoulder.x,
      y: rightShoulder.y + model.upperArm + model.forearm,
    },
    model.upperArm,
    model.forearm,
    1,
  );
  const leftLeg = solveTwoBoneJoint(
    leftHip,
    {
      x: leftHip.x,
      y: leftHip.y + model.thigh + model.shin,
    },
    model.thigh,
    model.shin,
    -1,
  );
  const rightLeg = solveTwoBoneJoint(
    rightHip,
    {
      x: rightHip.x,
      y: rightHip.y + model.thigh + model.shin,
    },
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

function endpointRootId(endpointId: SkeletonEndpointId) {
  switch (endpointId) {
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

function endpointJointId(endpointId: SkeletonEndpointId) {
  switch (endpointId) {
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

function limbLengths(model: SkeletonBodyModel, endpointId: SkeletonEndpointId) {
  if (endpointId === "leftHand" || endpointId === "rightHand") {
    return { first: model.upperArm, second: model.forearm };
  }

  return { first: model.thigh, second: model.shin };
}

function bendDirection(endpointId: SkeletonEndpointId): 1 | -1 {
  switch (endpointId) {
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

function jointEndpointId(jointId: SkeletonControlJointId): SkeletonEndpointId {
  switch (jointId) {
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
  vector: SimulationPoint,
  fallbackDirection: 1 | -1,
): SimulationPoint {
  const vectorDistance = distance({ x: 0, y: 0 }, vector);

  if (vectorDistance <= MIN_SOLVE_DISTANCE) {
    return fallbackFoldDirection(fallbackDirection);
  }

  return scaleVector(vector, 1 / vectorDistance);
}

function currentBendDirection(
  root: SimulationPoint,
  joint: SimulationPoint,
  endpoint: SimulationPoint,
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
  const signedDistance =
    rootToJoint.x * side.x + rootToJoint.y * side.y;

  if (Math.abs(signedDistance) <= MIN_SOLVE_DISTANCE) {
    return fallbackDirection;
  }

  return signedDistance > 0 ? 1 : -1;
}

function shiftCore(
  joints: SkeletonJointMap,
  delta: SimulationPoint,
): SkeletonJointMap {
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

  coreIds.forEach((jointId) => {
    shifted[jointId] = add(shifted[jointId], delta);
  });

  return shifted;
}

function rotatePointAround(
  point: SimulationPoint,
  center: SimulationPoint,
  angle: number,
): SimulationPoint {
  const translated = subtract(point, center);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: center.x + translated.x * cos - translated.y * sin,
    y: center.y + translated.x * sin + translated.y * cos,
  };
}

function rotateCore(
  joints: SkeletonJointMap,
  angle: number,
): SkeletonJointMap {
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

  coreIds.forEach((jointId) => {
    rotated[jointId] = rotatePointAround(rotated[jointId], center, angle);
  });

  return rotated;
}

function rotateUpperCore(
  joints: SkeletonJointMap,
  angle: number,
): SkeletonJointMap {
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

  upperIds.forEach((jointId) => {
    rotated[jointId] = rotatePointAround(
      rotated[jointId],
      rotated.pelvis,
      angle,
    );
  });

  return rotated;
}

function angleBetweenVectors(from: SimulationPoint, to: SimulationPoint) {
  const cross = from.x * to.y - from.y * to.x;
  const dot = from.x * to.x + from.y * to.y;

  return Math.atan2(cross, dot);
}

function isParallelToRootLimbDrag(
  root: SimulationPoint,
  joint: SimulationPoint,
  target: SimulationPoint,
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

  const cross =
    Math.abs(rootLimbVector.x * dragVector.y - rootLimbVector.y * dragVector.x);
  const parallelRatio = cross / (rootLimbDistance * dragDistance);

  return parallelRatio < maxParallelRatio;
}

function parallelRatio(a: SimulationPoint, b: SimulationPoint) {
  const aDistance = distance({ x: 0, y: 0 }, a);
  const bDistance = distance({ x: 0, y: 0 }, b);

  if (aDistance <= MIN_SOLVE_DISTANCE || bDistance <= MIN_SOLVE_DISTANCE) {
    return Number.POSITIVE_INFINITY;
  }

  const cross = Math.abs(a.x * b.y - a.y * b.x);

  return cross / (aDistance * bDistance);
}

function dotVectors(a: SimulationPoint, b: SimulationPoint) {
  return a.x * b.x + a.y * b.y;
}

function isHorizontalDrag(vector: SimulationPoint) {
  const totalDistance = Math.abs(vector.x) + Math.abs(vector.y);

  if (totalDistance <= MIN_SOLVE_DISTANCE) {
    return false;
  }

  return Math.abs(vector.x) / totalDistance >= HORIZONTAL_ARM_DRAG_RATIO;
}

function isBelowHorizontalArmDrag(
  root: SimulationPoint,
  endpoint: SimulationPoint,
  target: SimulationPoint,
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

function resolveStraightEndpointCoreDelta(
  root: SimulationPoint,
  endpoint: SimulationPoint,
  target: SimulationPoint,
  maxReach: number,
  maxParallelRatio = ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO,
): SimulationPoint | null {
  const rootToEndpointDistance = distance(root, endpoint);
  const targetVector = subtract(target, root);
  const targetDistance = distance(root, target);

  if (
    rootToEndpointDistance >= maxReach * 0.98 &&
    isParallelToRootLimbDrag(root, endpoint, target, maxParallelRatio)
  ) {
    const dragVector = subtract(target, endpoint);
    const rootToEndpoint = subtract(endpoint, root);

    return dotVectors(dragVector, rootToEndpoint) < 0 ? dragVector : null;
  }

  if (targetDistance < maxReach * 0.82 || targetDistance > maxReach) {
    return null;
  }

  const dragVector = subtract(target, endpoint);

  if (parallelRatio(targetVector, dragVector) >= maxParallelRatio) {
    return null;
  }

  const straightEndpoint = add(
    root,
    scaleVector(targetVector, maxReach / targetDistance),
  );
  const coreDelta = subtract(target, straightEndpoint);

  if (distance({ x: 0, y: 0 }, coreDelta) <= MIN_SOLVE_DISTANCE) {
    return null;
  }

  return coreDelta;
}

function isEndpointStraightForCoreDrag(
  pose: SkeletonPose,
  endpointId: SkeletonEndpointId,
  model: SkeletonBodyModel,
) {
  const lengths = limbLengths(model, endpointId);
  const maxReach = lengths.first + lengths.second;
  const rootId = endpointRootId(endpointId);

  return (
    distance(pose.joints[rootId], pose.joints[endpointId]) >=
    maxReach * STRAIGHT_CORE_DRAG_REACH_RATIO
  );
}

export function createSkeletonStraightCoreDragState(
  pose: SkeletonPose,
  endpointId: SkeletonEndpointId,
  model: SkeletonBodyModel,
): SkeletonStraightCoreDragState {
  const isStraight = isEndpointStraightForCoreDrag(pose, endpointId, model);

  return {
    hasReachedStraight: isStraight,
    canUseCoreDrag: isStraight,
  };
}

export function updateSkeletonStraightCoreDragState(
  pose: SkeletonPose,
  endpointId: SkeletonEndpointId,
  target: SimulationPoint,
  model: SkeletonBodyModel,
  state: SkeletonStraightCoreDragState,
): SkeletonStraightCoreDragState {
  if (state.canUseCoreDrag) {
    return state;
  }

  const lengths = limbLengths(model, endpointId);
  const maxReach = lengths.first + lengths.second;
  const rootId = endpointRootId(endpointId);
  const root = pose.joints[rootId];
  const targetDistance = distance(root, target);
  const hasReachedStraight =
    state.hasReachedStraight ||
    targetDistance >= maxReach * STRAIGHT_CORE_DRAG_REACH_RATIO;

  if (!hasReachedStraight) {
    return {
      hasReachedStraight: false,
      canUseCoreDrag: false,
    };
  }

  const coreDelta = resolveStraightEndpointCoreDelta(
    root,
    pose.joints[endpointId],
    target,
    maxReach,
  );
  const canUseCoreDrag =
    coreDelta !== null &&
    distance({ x: 0, y: 0 }, coreDelta) >=
      STRAIGHT_CORE_DRAG_PROMOTE_DISTANCE;

  return {
    hasReachedStraight,
    canUseCoreDrag,
  };
}

function isHandEndpoint(endpointId: SkeletonEndpointId) {
  return endpointId === "leftHand" || endpointId === "rightHand";
}

function isFootEndpoint(endpointId: SkeletonEndpointId) {
  return endpointId === "leftFoot" || endpointId === "rightFoot";
}

function isStraightEndpointPullAway(
  root: SimulationPoint,
  endpoint: SimulationPoint,
  target: SimulationPoint,
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

function oppositeFootEndpointId(
  endpointId: SkeletonEndpointId,
): SkeletonEndpointId | null {
  switch (endpointId) {
    case "leftHand":
      return "rightFoot";
    case "rightHand":
      return "leftFoot";
    default:
      return null;
  }
}

function maxAnchoredShiftDistance(
  anchorRoot: SimulationPoint,
  anchorEndpoint: SimulationPoint,
  direction: SimulationPoint,
  anchorMaxReach: number,
) {
  const anchorRootToEndpoint = subtract(anchorRoot, anchorEndpoint);
  const projectedDistance =
    anchorRootToEndpoint.x * direction.x + anchorRootToEndpoint.y * direction.y;
  const currentAnchorDistance = distance(anchorRoot, anchorEndpoint);
  const remainingReach =
    anchorMaxReach * anchorMaxReach - currentAnchorDistance * currentAnchorDistance;

  if (remainingReach <= MIN_SOLVE_DISTANCE) {
    return 0;
  }

  const discriminant =
    projectedDistance * projectedDistance + Math.max(0, remainingReach);

  return Math.max(0, -projectedDistance + Math.sqrt(discriminant));
}

function resolveHandCoreShift(
  endpointId: SkeletonEndpointId,
  movingRoot: SimulationPoint,
  joints: SkeletonJointMap,
  target: SimulationPoint,
  rootMaxReach: number,
  model: SkeletonBodyModel,
  previousMode?: SkeletonDragResolutionMode | null,
): SimulationPoint {
  const isLockedCoreDrag = previousMode === "core";
  const targetDistance = distance(movingRoot, target);
  const overflow = Math.max(0, targetDistance - rootMaxReach);
  const targetVector = subtract(target, movingRoot);
  const directionalDistance = Math.abs(targetVector.x) + Math.abs(targetVector.y);
  const horizontalRatio =
    directionalDistance > MIN_SOLVE_DISTANCE
      ? Math.abs(targetVector.x) / directionalDistance
      : 0;
  const verticalRatio =
    targetVector.y < 0 && directionalDistance > MIN_SOLVE_DISTANCE
      ? Math.abs(targetVector.y) / directionalDistance
      : 0;

  if (
    overflow <= MIN_SOLVE_DISTANCE ||
    targetDistance <= MIN_SOLVE_DISTANCE
  ) {
    return { x: 0, y: 0 };
  }

  const reachRatio = targetDistance / rootMaxReach;
  const verticalDirectionRatio = isLockedCoreDrag
    ? HAND_CORE_VERTICAL_LOCKED_DIRECTION_RATIO
    : HAND_CORE_VERTICAL_DIRECTION_RATIO;
  const horizontalDirectionRatio = isLockedCoreDrag
    ? HAND_CORE_HORIZONTAL_LOCKED_DIRECTION_RATIO
    : HAND_CORE_HORIZONTAL_DIRECTION_RATIO;
  const isVerticalLunge =
    verticalRatio >= verticalDirectionRatio;
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
  const anchorEndpointIds =
    verticalRatio >= verticalDirectionRatio
      ? (["leftFoot", "rightFoot"] as const)
      : horizontalRatio >= horizontalDirectionRatio
        ? ([oppositeFootEndpointId(endpointId)].filter(
            Boolean,
          ) as SkeletonEndpointId[])
        : [];

  if (anchorEndpointIds.length === 0) {
    return { x: 0, y: 0 };
  }

  const anchorShiftDistances = anchorEndpointIds.map((anchorEndpointId) => {
    const anchorRootId = endpointRootId(anchorEndpointId);
    const lengths = limbLengths(model, anchorEndpointId);

    return maxAnchoredShiftDistance(
      joints[anchorRootId],
      joints[anchorEndpointId],
      direction,
      lengths.first + lengths.second,
    );
  });
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
  const maxShiftDistance =
    hasDominantVerticalSupport
      ? strongestAnchorShiftDistance
      : Math.min(...anchorShiftDistances);
  const shiftDistance = Math.min(
    overflow * (isVerticalLunge ? 1 : HAND_CORE_FOLLOW_RATIO) * reachEffort,
    maxShiftDistance,
  );

  return scaleVector(direction, shiftDistance);
}

function resolveCoreRotationAngle(
  endpointId: SkeletonEndpointId,
  root: SimulationPoint,
  target: SimulationPoint,
  maxReach: number,
  reachEffort: number,
) {
  const horizontalReachRatio = clampNumber(
    Math.abs(target.x - root.x) / maxReach,
    0,
    1,
  );
  const isFoot = endpointId === "leftFoot" || endpointId === "rightFoot";
  const isHand = endpointId === "leftHand" || endpointId === "rightHand";

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

function resolveCoreReachEffort(
  targetDistance: number,
  maxReach: number,
) {
  const rawEffort =
    (targetDistance - maxReach * LEG_CORE_RESPONSE_START_REACH_RATIO) /
    (maxReach *
      (LEG_CORE_RESPONSE_FULL_REACH_RATIO - LEG_CORE_RESPONSE_START_REACH_RATIO));

  return smoothStep(clampNumber(rawEffort, 0, 1));
}

function resolveShoulderReach(
  shoulder: SimulationPoint,
  neck: SimulationPoint,
  target: SimulationPoint,
  maxReach: number,
): SimulationPoint {
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
  joints: SkeletonJointMap,
  model: SkeletonBodyModel,
  draggedEndpointId: SkeletonEndpointId,
): SkeletonJointMap {
  const resolved = { ...joints };
  const endpoints: SkeletonEndpointId[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  endpoints.forEach((endpointId) => {
    if (endpointId === draggedEndpointId) {
      return;
    }

    const rootId = endpointRootId(endpointId);
    const jointId = endpointJointId(endpointId);
    const lengths = limbLengths(model, endpointId);
    const solved = solveTwoBoneJoint(
      resolved[rootId],
      resolved[endpointId],
      lengths.first,
      lengths.second,
      currentBendDirection(
        resolved[rootId],
        resolved[jointId],
        resolved[endpointId],
        bendDirection(endpointId),
      ),
    );

    resolved[jointId] = solved.joint;
    resolved[endpointId] = solved.endpoint;
  });

  return resolved;
}

function resolveAnchoredLimbs(
  shiftedCoreJoints: SkeletonJointMap,
  anchorJoints: SkeletonJointMap,
  model: SkeletonBodyModel,
): SkeletonJointMap {
  const resolved = { ...shiftedCoreJoints };
  const endpoints: SkeletonEndpointId[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  endpoints.forEach((endpointId) => {
    const rootId = endpointRootId(endpointId);
    const jointId = endpointJointId(endpointId);
    const lengths = limbLengths(model, endpointId);
    const solved = solveTwoBoneJoint(
      resolved[rootId],
      anchorJoints[endpointId],
      lengths.first,
      lengths.second,
      currentBendDirection(
        anchorJoints[rootId],
        anchorJoints[jointId],
        anchorJoints[endpointId],
        bendDirection(endpointId),
      ),
    );

    resolved[jointId] = solved.joint;
    resolved[endpointId] = solved.endpoint;
  });

  return resolved;
}

export function resolveSkeletonPoseDragWithMode(
  pose: SkeletonPose,
  input: SkeletonDragInput,
  model: SkeletonBodyModel,
): SkeletonDragResolution {
  const rootId = endpointRootId(input.endpointId);
  const jointId = endpointJointId(input.endpointId);
  const lengths = limbLengths(model, input.endpointId);
  const maxReach = lengths.first + lengths.second;
  const root = pose.joints[rootId];
  const targetDistance = distance(root, input.target);
  const isHand = isHandEndpoint(input.endpointId);
  const isFoot = isFootEndpoint(input.endpointId);
  const maxParallelRatio =
    input.previousMode === "core"
      ? ROOT_LIMB_CORE_RELEASE_PARALLEL_RATIO
      : ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO;
  const straightCoreDragAllowed = input.straightCoreDragAllowed !== false;
  const isBlockedBelowHorizontalArmDrag =
    isHand &&
    isBelowHorizontalArmDrag(
      root,
      pose.joints[input.endpointId],
      input.target,
    );
  const straightEndpointCoreDelta =
    isHand || isFoot
    ? straightCoreDragAllowed && !isBlockedBelowHorizontalArmDrag
      ? resolveStraightEndpointCoreDelta(
          root,
          pose.joints[input.endpointId],
          input.target,
          maxReach,
          maxParallelRatio,
        )
      : null
    : null;

  if (straightEndpointCoreDelta) {
    return {
      pose: resolveSkeletonCoreDrag(
        pose,
        {
          delta: straightEndpointCoreDelta,
        },
        model,
      ),
      mode: "core",
    };
  }

  const reachEffort = isHand
    ? 0
    : isFoot &&
        isStraightEndpointPullAway(
          root,
          pose.joints[input.endpointId],
          input.target,
          maxReach,
        )
      ? 0
    : resolveCoreReachEffort(targetDistance, maxReach);
  const overflow = Math.max(0, targetDistance - maxReach);
  const coreShift = isHand
    ? resolveHandCoreShift(
        input.endpointId,
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
    input.endpointId,
    root,
    input.target,
    maxReach,
    reachEffort,
  );
  const shiftedJoints = isHand
    ? shiftCore(rotateUpperCore(pose.joints, coreRotationAngle), coreShift)
    : rotateCore(shiftCore(pose.joints, coreShift), coreRotationAngle);
  const rootedJoints: SkeletonJointMap = isHand
    ? {
        ...shiftedJoints,
        [rootId]: resolveShoulderReach(
          shiftedJoints[rootId],
          shiftedJoints.neck,
          input.target,
          maxReach,
        ),
      }
    : shiftedJoints;
  const solveTarget =
    isHand && distance(rootedJoints[rootId], input.target) > maxReach
      ? clampDistance(rootedJoints[rootId], input.target, maxReach)
      : input.target;
  const solved = solveTwoBoneJoint(
    rootedJoints[rootId],
    solveTarget,
    lengths.first,
    lengths.second,
    currentBendDirection(
      rootedJoints[rootId],
      rootedJoints[jointId],
      rootedJoints[input.endpointId],
      bendDirection(input.endpointId),
    ),
  );
  const nextJoints: SkeletonJointMap = {
    ...rootedJoints,
    [jointId]: solved.joint,
    [input.endpointId]: solved.endpoint,
  };

  return {
    pose: {
      joints: resolveRestingLimbs(nextJoints, model, input.endpointId),
    },
    mode: distance({ x: 0, y: 0 }, coreShift) > MIN_SOLVE_DISTANCE
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
  const endpointId = jointEndpointId(input.jointId);
  const rootId = endpointRootId(endpointId);
  const lengths = limbLengths(model, endpointId);
  const maxParallelRatio =
    input.previousMode === "core"
      ? ROOT_LIMB_CORE_RELEASE_PARALLEL_RATIO
      : ROOT_LIMB_CORE_ENTER_PARALLEL_RATIO;
  const coreDragAllowed = input.coreDragAllowed !== false;
  const isBlockedBelowHorizontalArmDrag =
    isHandEndpoint(endpointId) &&
    isBelowHorizontalArmDrag(
      pose.joints[rootId],
      pose.joints[input.jointId],
      input.target,
    );

  if (
    coreDragAllowed &&
    !isBlockedBelowHorizontalArmDrag &&
    isParallelToRootLimbDrag(
      pose.joints[rootId],
      pose.joints[input.jointId],
      input.target,
      maxParallelRatio,
    )
  ) {
    return {
      pose: resolveSkeletonCoreDrag(
        pose,
        {
          delta: subtract(input.target, pose.joints[input.jointId]),
        },
        model,
      ),
      mode: "core",
    };
  }

  const direction = normalizeOrFallback(
    subtract(input.target, pose.joints[rootId]),
    bendDirection(endpointId),
  );
  const joint = add(pose.joints[rootId], scaleVector(direction, lengths.first));
  const endpointDirection = normalizeOrFallback(
    subtract(pose.joints[endpointId], joint),
    bendDirection(endpointId),
  );
  const endpoint = add(
    joint,
    scaleVector(endpointDirection, lengths.second),
  );
  const nextJoints: SkeletonJointMap = {
    ...pose.joints,
    [input.jointId]: joint,
    [endpointId]: endpoint,
  };

  return {
    pose: {
      joints: resolveRestingLimbs(nextJoints, model, endpointId),
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
  const nextJoints: SkeletonJointMap = {
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

  SKELETON_JOINT_IDS.forEach((jointId) => {
    joints[jointId] = limitPointStep(
      currentPose.joints[jointId],
      targetPose.joints[jointId],
      maxJointDistance,
    );
  });

  return { joints };
}

export function translateSkeletonPose(
  pose: SkeletonPose,
  delta: SimulationPoint,
): SkeletonPose {
  const translatedJoints = Object.entries(
    pose.joints,
  ).reduce<SkeletonJointMap>(
    (nextJoints, [jointId, point]) => ({
      ...nextJoints,
      [jointId]: add(point, delta),
    }),
    {} as SkeletonJointMap,
  );

  return {
    joints: translatedJoints,
  };
}

export function getEndpointPosition(
  pose: SkeletonPose,
  endpointId: SkeletonEndpointId,
): SimulationPoint {
  return pose.joints[endpointId];
}

export function getSkeletonCenter(pose: SkeletonPose): SimulationPoint {
  return midpoint(pose.joints.torso, pose.joints.pelvis);
}
