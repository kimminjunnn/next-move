import type { SimulationPoint } from "../types/simulation";
import type {
  SkeletonBodyModel,
  SkeletonControlJointId,
  SkeletonDragInput,
  SkeletonEndpointId,
  SkeletonJointDragInput,
  SkeletonJointMap,
  SkeletonPose,
} from "../types/skeletonPose";

const TORSO_FOLLOW_RATIO = 0.38;
const MIN_SOLVE_DISTANCE = 0.001;

function add(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scaleVector(point: SimulationPoint, scale: number): SimulationPoint {
  return { x: point.x * scale, y: point.y * scale };
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
      bendDirection(endpointId),
    );

    resolved[jointId] = solved.joint;
    resolved[endpointId] = solved.endpoint;
  });

  return resolved;
}

export function resolveSkeletonPoseDrag(
  pose: SkeletonPose,
  input: SkeletonDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  const rootId = endpointRootId(input.endpointId);
  const jointId = endpointJointId(input.endpointId);
  const lengths = limbLengths(model, input.endpointId);
  const maxReach = lengths.first + lengths.second;
  const root = pose.joints[rootId];
  const targetDistance = distance(root, input.target);
  const overflow = Math.max(0, targetDistance - maxReach * 0.82);
  const coreShift =
    targetDistance > 0
      ? scaleVector(
          subtract(input.target, root),
          (overflow / targetDistance) * TORSO_FOLLOW_RATIO,
        )
      : { x: 0, y: 0 };
  const shiftedJoints = shiftCore(pose.joints, coreShift);
  const solved = solveTwoBoneJoint(
    shiftedJoints[rootId],
    input.target,
    lengths.first,
    lengths.second,
    currentBendDirection(
      shiftedJoints[rootId],
      shiftedJoints[jointId],
      shiftedJoints[input.endpointId],
      bendDirection(input.endpointId),
    ),
  );
  const nextJoints: SkeletonJointMap = {
    ...shiftedJoints,
    [jointId]: solved.joint,
    [input.endpointId]: solved.endpoint,
  };

  return {
    joints: resolveRestingLimbs(nextJoints, model, input.endpointId),
  };
}

export function resolveSkeletonJointDrag(
  pose: SkeletonPose,
  input: SkeletonJointDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  const endpointId = jointEndpointId(input.jointId);
  const rootId = endpointRootId(endpointId);
  const lengths = limbLengths(model, endpointId);
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
    joints: resolveRestingLimbs(nextJoints, model, endpointId),
  };
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
