require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createDefaultSkeletonPose,
  resolveSkeletonCoreDrag,
  resolveSkeletonHeadDrag,
  resolveSkeletonJointDrag,
  resolveSkeletonJointDragWithMode,
  resolveSkeletonPoseDrag,
  resolveSkeletonPoseDragWithMode,
  resolveSkeletonBodyDrag,
  limitSkeletonPoseStep,
  limitSkeletonPoseStepWithModel,
} = require("./skeletonPoseSolver.ts");

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

test("places the default head at the model head-neck distance", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    headToNeck: 22,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };

  const pose = createDefaultSkeletonPose(model, 240, 360);

  assert.ok(
    Math.abs(distance(pose.joints.head, pose.joints.neck) - model.headToNeck) <
      0.001,
  );
  assert.equal(pose.joints.head.x, pose.joints.neck.x);
  assert.equal(pose.joints.head.y, pose.joints.neck.y - model.headToNeck);
});

test("limits every skeleton joint to the requested per-frame movement", () => {
  const currentPose = {
    joints: {
      head: { x: 0, y: 0 },
      neck: { x: 0, y: 10 },
      torso: { x: 0, y: 20 },
      pelvis: { x: 0, y: 30 },
      leftShoulder: { x: -10, y: 10 },
      rightShoulder: { x: 10, y: 10 },
      leftElbow: { x: -20, y: 20 },
      rightElbow: { x: 20, y: 20 },
      leftHand: { x: -30, y: 30 },
      rightHand: { x: 30, y: 30 },
      leftHip: { x: -10, y: 35 },
      rightHip: { x: 10, y: 35 },
      leftKnee: { x: -20, y: 55 },
      rightKnee: { x: 20, y: 55 },
      leftFoot: { x: -25, y: 75 },
      rightFoot: { x: 25, y: 75 },
    },
  };
  const targetPose = {
    joints: Object.fromEntries(
      Object.entries(currentPose.joints).map(([jointName, point]) => [
        jointName,
        { x: point.x + 100, y: point.y - 100 },
      ]),
    ),
  };
  const limitedPose = limitSkeletonPoseStep(currentPose, targetPose, 12);

  Object.keys(currentPose.joints).forEach((jointName) => {
    assert.ok(
      distance(
        currentPose.joints[jointName],
        limitedPose.joints[jointName],
      ) <= 12.001,
      `${jointName} should not jump farther than the frame limit`,
    );
  });
  assert.deepEqual(
    limitSkeletonPoseStep(currentPose, targetPose, 0),
    currentPose,
  );
});

test("translates the whole skeleton when body dragging in calibration mode", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    headToNeck: 22,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const delta = { x: 18, y: -12 };
  const nextPose = resolveSkeletonBodyDrag(
    pose,
    { delta },
    model,
    "calibrating",
  );

  Object.entries(pose.joints).forEach(([jointName, point]) => {
    assert.deepEqual(nextPose.joints[jointName], {
      x: point.x + delta.x,
      y: point.y + delta.y,
    });
  });
});

test("keeps simulation body drag anchored to prior hand and foot endpoints", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    headToNeck: 22,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const nextPose = resolveSkeletonBodyDrag(
    pose,
    { delta: { x: 2, y: 0 } },
    model,
    "simulating",
  );

  assert.ok(nextPose.joints.torso.x > pose.joints.torso.x);
  assert.ok(distance(nextPose.joints.leftHand, pose.joints.leftHand) < 0.5);
  assert.ok(distance(nextPose.joints.rightHand, pose.joints.rightHand) < 0.5);
  assert.ok(distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 0.5);
  assert.ok(distance(nextPose.joints.rightFoot, pose.joints.rightFoot) < 0.5);
});

test("model-aware frame limiting reprojects limb joints back to segment lengths", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const currentPose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 80, y: 80 },
      rightElbow: { x: 120, y: 80 },
      leftHand: { x: 80, y: 115 },
      rightHand: { x: 120, y: 115 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 85, y: 160 },
      rightKnee: { x: 115, y: 160 },
      leftFoot: { x: 85, y: 210 },
      rightFoot: { x: 115, y: 210 },
    },
  };
  const targetPose = {
    joints: {
      ...currentPose.joints,
      leftShoulder: { x: 140, y: 40 },
      leftElbow: { x: 80, y: 81 },
      leftHand: { x: 78, y: 115 },
    },
  };
  const limitedPose = limitSkeletonPoseStepWithModel(
    currentPose,
    targetPose,
    14,
    model,
  );

  assert.ok(
    Math.abs(
      distance(limitedPose.joints.leftShoulder, limitedPose.joints.leftElbow) -
        model.upperArm,
    ) < 0.001,
    "upper arm should be projected back to its modeled length",
  );
  assert.ok(
    Math.abs(
      distance(limitedPose.joints.leftElbow, limitedPose.joints.leftHand) -
        model.forearm,
    ) < 0.001,
    "forearm should be projected back to its modeled length",
  );
});

test("keeps model-aware frame limiting within the requested per-frame movement", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const currentPose = {
    joints: {
      head: { x: 150, y: 164 },
      neck: { x: 150, y: 179.5 },
      torso: { x: 150, y: 189.5 },
      pelvis: { x: 150, y: 219.5 },
      leftShoulder: { x: 130, y: 187.5 },
      rightShoulder: { x: 170, y: 187.5 },
      leftElbow: { x: 130, y: 227.5 },
      rightElbow: { x: 170, y: 227.5 },
      leftHand: { x: 130, y: 262.5 },
      rightHand: { x: 170, y: 262.5 },
      leftHip: { x: 135, y: 219.5 },
      rightHip: { x: 165, y: 219.5 },
      leftKnee: { x: 135, y: 279.5 },
      rightKnee: { x: 165, y: 279.5 },
      leftFoot: { x: 135, y: 329.5 },
      rightFoot: { x: 165, y: 329.5 },
    },
  };
  const targetPose = {
    joints: {
      ...currentPose.joints,
      leftShoulder: { x: 267.5744482002689, y: 252.15238956576474 },
      leftElbow: { x: 146.16380729531664, y: 176.88712467258395 },
      leftHand: { x: 188.85286637160831, y: 140.5149200555074 },
    },
  };
  const maxJointDistance = 14;
  const limitedPose = limitSkeletonPoseStepWithModel(
    currentPose,
    targetPose,
    maxJointDistance,
    model,
  );

  Object.keys(currentPose.joints).forEach((jointName) => {
    assert.ok(
      distance(
        currentPose.joints[jointName],
        limitedPose.joints[jointName],
      ) <=
        maxJointDistance + 0.001,
      `${jointName} should not jump farther than the model-aware frame limit`,
    );
  });
});

test("keeps the foot close to its prior position when a knee is dragged into a drop-knee shape", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const priorFoot = { x: 124.72, y: 180.17 };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 100, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 120, y: 160 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: priorFoot,
    },
  };

  const nextPose = resolveSkeletonJointDrag(
    pose,
    {
      jointName: "rightKnee",
      target: { x: 80, y: 156.57 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.rightFoot.x > nextPose.joints.rightKnee.x,
    "right foot should remain outside the inward-dragged knee",
  );
  assert.ok(
    distance(nextPose.joints.rightFoot, priorFoot) < 2,
    "right foot should only move enough to satisfy shin length",
  );
});

test("treats a knee drag parallel to the thigh like a core drag", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const delta = { x: 4, y: 11 };
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonJointDrag(
    pose,
    {
      jointName: "rightKnee",
      target: {
        x: pose.joints.rightKnee.x + delta.x,
        y: pose.joints.rightKnee.y + delta.y,
      },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.torso, expectedPose.joints.torso) < 0.1,
    "foot drag after straightening should move the torso like a core drag",
  );
  assert.ok(
    distance(nextPose.joints.pelvis, expectedPose.joints.pelvis) < 0.1,
    "foot drag after straightening should move the pelvis like a core drag",
  );
  assert.deepEqual(nextPose.joints.rightHip, expectedPose.joints.rightHip);
  assert.ok(
    distance(nextPose.joints.rightFoot, expectedPose.joints.rightFoot) < 0.001,
    "parallel thigh knee drag should keep the same foot anchoring as a core drag",
  );
  assert.ok(
    distance(nextPose.joints.rightKnee, expectedPose.joints.rightKnee) < 0.001,
    "parallel thigh knee drag should resolve the knee exactly like a core drag",
  );
});

test("treats an elbow drag parallel to the upper arm like a core drag", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const delta = { x: 4, y: 7 };
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonJointDrag(
    pose,
    {
      jointName: "rightElbow",
      target: {
        x: pose.joints.rightElbow.x + delta.x,
        y: pose.joints.rightElbow.y + delta.y,
      },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.torso, expectedPose.joints.torso) < 0.1,
    "foot drag after straightening should move the torso like a core drag",
  );
  assert.ok(
    distance(nextPose.joints.pelvis, expectedPose.joints.pelvis) < 0.1,
    "foot drag after straightening should move the pelvis like a core drag",
  );
  assert.deepEqual(nextPose.joints.rightShoulder, expectedPose.joints.rightShoulder);
  assert.ok(
    distance(nextPose.joints.rightHand, expectedPose.joints.rightHand) < 0.001,
    "parallel upper-arm elbow drag should keep the same hand anchoring as a core drag",
  );
  assert.ok(
    distance(nextPose.joints.rightElbow, expectedPose.joints.rightElbow) < 0.001,
    "parallel upper-arm elbow drag should resolve the elbow exactly like a core drag",
  );
});

test("keeps the core fixed when a straight hand is pushed toward the body", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 74.64 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 157.5, y: 104.95 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const delta = { x: -4, y: -7 };
  const target = {
    x: pose.joints.rightHand.x + delta.x,
    y: pose.joints.rightHand.y + delta.y,
  };

  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightHand",
      target,
    },
    model,
  );
  const nextPose = resolution.pose;

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightHand, target) < 0.001,
    "parallel straight-arm hand drag should place the endpoint instead of moving the core",
  );
});

test("does not core-drag when a straight arm hand is pulled away from the body", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 74.64 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 157.5, y: 104.95 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: {
        x: pose.joints.rightHand.x + 4,
        y: pose.joints.rightHand.y + 7,
      },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightShoulder, nextPose.joints.rightHand) <=
      model.upperArm + model.forearm + 0.001,
    "pulling away from an already straight arm should not stretch past the arm reach limit",
  );
});

test("keeps endpoint hand drag in pose mode after a bent arm becomes straight", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 148, y: 54 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 156, y: 88 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const straightHand = { x: 165, y: 100 };
  const delta = { x: -6, y: -8 };
  const target = {
    x: straightHand.x + delta.x,
    y: straightHand.y + delta.y,
  };

  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightHand",
      target,
    },
    model,
  );
  const nextPose = resolution.pose;

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightHand, target) < 0.001,
    "hand endpoint drag should keep placing the hand after straightening",
  );
});

test("keeps the core fixed when a straight foot is pushed toward the body", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 127, y: 159 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 137, y: 208 },
    },
  };
  const delta = { x: -2, y: -10 };
  const target = {
    x: pose.joints.rightFoot.x + delta.x,
    y: pose.joints.rightFoot.y + delta.y,
  };

  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightFoot",
      target,
    },
    model,
  );
  const nextPose = resolution.pose;

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.deepEqual(nextPose.joints.rightHip, pose.joints.rightHip);
  assert.ok(
    distance(nextPose.joints.rightFoot, target) < 0.001,
    "parallel straight-leg foot drag should place the endpoint instead of moving the core",
  );
});

test("does not core-drag when a straight leg foot is pulled away from the body", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 127, y: 159 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 137, y: 208 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightFoot",
      target: {
        x: pose.joints.rightFoot.x + 2,
        y: pose.joints.rightFoot.y + 10,
      },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) <=
      model.thigh + model.shin + 0.001,
    "pulling away from an already straight leg should not stretch past the leg reach limit",
  );
});

test("does not re-trigger straight foot core drag near the hip after core mode", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 127, y: 159 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 137, y: 208 },
    },
  };
  const foldedTarget = { x: 118, y: 112 };
  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightFoot",
      target: foldedTarget,
      previousMode: "core",
    },
    model,
  );

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(resolution.pose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(resolution.pose.joints.rightFoot, foldedTarget) < 0.001,
    "folding a straight leg back near the hip should resolve the foot target instead of moving the core",
  );
});

test("keeps endpoint foot drag in pose mode after a bent leg becomes straight", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 152, y: 150 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 133, y: 188 },
    },
  };
  const straightFoot = { x: 137, y: 207.78 };
  const delta = { x: -2, y: -10 };
  const target = {
    x: straightFoot.x + delta.x,
    y: straightFoot.y + delta.y,
  };

  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightFoot",
      target,
    },
    model,
  );
  const nextPose = resolution.pose;

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightFoot, target) < 0.001,
    "foot endpoint drag should keep placing the foot after straightening",
  );
});

test("keeps foot endpoint drag in pose mode after a deliberate straight-leg push", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 152, y: 150 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 133, y: 188 },
    },
  };
  const straightFoot = { x: 137, y: 207.78 };
  const nearStraightTarget = { x: straightFoot.x - 0.2, y: straightFoot.y - 1 };
  const deliberatePushTarget = {
    x: straightFoot.x - 2.4,
    y: straightFoot.y - 12,
  };
  const nearStraightPose = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightFoot",
      target: nearStraightTarget,
    },
    model,
  );
  const pushedPose = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightFoot",
      target: deliberatePushTarget,
    },
    model,
  );

  assert.equal(nearStraightPose.mode, "pose");
  assert.equal(pushedPose.mode, "pose");
  assert.deepEqual(pushedPose.pose.joints.torso, pose.joints.torso);
  assert.deepEqual(pushedPose.pose.joints.pelvis, pose.joints.pelvis);
});

test("keeps a drop-knee bend when the foot is dragged afterward", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 100, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 120, y: 160 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 124.72, y: 180.17 },
    },
  };
  const dropKneePose = resolveSkeletonJointDrag(
    pose,
    {
      jointName: "rightKnee",
      target: { x: 80, y: 156.57 },
    },
    model,
  );
  const nextPose = resolveSkeletonPoseDrag(
    dropKneePose,
    {
      endpointName: "rightFoot",
      target: {
        x: dropKneePose.joints.rightFoot.x + 6,
        y: dropKneePose.joints.rightFoot.y + 2,
      },
    },
    model,
  );

  assert.ok(
    nextPose.joints.rightKnee.x < nextPose.joints.rightHip.x,
    "right knee should stay inside the right hip after foot drag",
  );
  assert.ok(
    distance(nextPose.joints.rightKnee, dropKneePose.joints.rightKnee) < 16,
    "right knee should not jump across the leg when the foot moves",
  );
});

test("keeps a drop-knee bend when another handler is dragged afterward", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 100, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 120, y: 160 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 124.72, y: 180.17 },
    },
  };
  const dropKneePose = resolveSkeletonJointDrag(
    pose,
    {
      jointName: "rightKnee",
      target: { x: 80, y: 156.57 },
    },
    model,
  );
  const nextPose = resolveSkeletonPoseDrag(
    dropKneePose,
    {
      endpointName: "rightHand",
      target: {
        x: dropKneePose.joints.rightHand.x + 8,
        y: dropKneePose.joints.rightHand.y - 4,
      },
    },
    model,
  );

  assert.ok(
    dropKneePose.joints.rightKnee.x < dropKneePose.joints.rightHip.x,
    "setup should create an inward right drop-knee",
  );
  assert.ok(
    nextPose.joints.rightKnee.x < nextPose.joints.rightHip.x,
    "right knee should stay inside the right hip after another handler moves",
  );
  assert.ok(
    distance(nextPose.joints.rightKnee, dropKneePose.joints.rightKnee) < 8,
    "right knee should not pop back to the default bend",
  );
});

test("moves the core while keeping reachable hands and feet anchored", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta: { x: 6, y: 4 },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, { x: 106, y: 59 });
  assert.deepEqual(nextPose.joints.pelvis, { x: 106, y: 89 });
  assert.ok(
    distance(nextPose.joints.leftHand, pose.joints.leftHand) < 0.001,
    "left hand should stay on the same hold when still reachable",
  );
  assert.ok(
    distance(nextPose.joints.rightHand, pose.joints.rightHand) < 0.001,
    "right hand should stay on the same hold when still reachable",
  );
  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 0.001,
    "left foot should stay on the same hold when still reachable",
  );
  assert.ok(
    distance(nextPose.joints.rightFoot, pose.joints.rightFoot) < 0.001,
    "right foot should stay on the same hold when still reachable",
  );
});

test("lets the shoulder follow a near-full hand reach without moving the torso", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 190, y: 40 },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.neck, pose.joints.neck) < 0.5,
    "near-full hand reach should not rotate the neck",
  );
  assert.ok(
    distance(nextPose.joints.torso, pose.joints.torso) < 0.5,
    "near-full hand reach should not rotate the torso",
  );
  assert.ok(
    nextPose.joints.rightShoulder.x > pose.joints.rightShoulder.x,
    "reaching shoulder should follow the hand",
  );
  assert.ok(
    distance(nextPose.joints.rightShoulder, pose.joints.rightShoulder) < 5,
    "shoulder rotation should stay subtle",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.rightShoulder) -
        distance(pose.joints.neck, pose.joints.rightShoulder),
    ) < 0.001,
    "shoulder follow should rotate around the neck without stretching",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.torso) -
        distance(pose.joints.neck, pose.joints.torso),
    ) < 0.001,
    "hand reach rotation should not stretch the upper spine",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.torso, nextPose.joints.pelvis) -
        distance(pose.joints.torso, pose.joints.pelvis),
    ) < 0.001,
    "hand reach rotation should not stretch the lower spine",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.rightShoulder, nextPose.joints.rightElbow) -
        model.upperArm,
    ) < 0.01,
    "IK should preserve upper-arm length",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.rightElbow, nextPose.joints.rightHand) -
        model.forearm,
    ) < 0.01,
    "IK should preserve forearm length",
  );
});

test("lets a far hand reach straighten fully without stretching either arm bone", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 140, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 220, y: 24 },
    },
    model,
  );
  const armReach = distance(
    nextPose.joints.rightShoulder,
    nextPose.joints.rightHand,
  );

  assert.ok(
    armReach > model.upperArm + model.forearm - 0.001,
    "far hand drag should allow the arm to straighten fully",
  );
  assert.ok(
    armReach <= model.upperArm + model.forearm + 0.001,
    "far hand drag should not stretch the arm beyond its bone lengths",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.rightShoulder, nextPose.joints.rightElbow) -
        model.upperArm,
    ) < 0.01,
    "far hand drag should preserve the upper-arm bone length",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.rightElbow, nextPose.joints.rightHand) -
        model.forearm,
    ) < 0.01,
    "far hand drag should preserve the forearm bone length",
  );
});

test("leans the body into a far hand reach while keeping the opposite foot anchored", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 128, y: 142 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 126, y: 185 },
    },
  };
  const target = { x: -55, y: 15 };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target,
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.rightFoot, pose.joints.rightFoot) < 1,
    "right foot should stay anchored while the left hand reaches",
  );
  assert.ok(
    nextPose.joints.neck.x < pose.joints.neck.x,
    "upper body should lean toward a far left-hand reach",
  );
  assert.ok(
    nextPose.joints.pelvis.x < pose.joints.pelvis.x,
    "pelvis should follow the reach instead of staying pinned",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) >
      model.thigh + model.shin - 1,
    "opposite leg should extend to its natural reach limit before the foot lifts",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) <=
      model.thigh + model.shin + 0.001,
    "opposite leg should not stretch past its bone lengths",
  );
  assert.ok(
    distance(nextPose.joints.leftShoulder, target) <
      distance(pose.joints.leftShoulder, target),
    "left shoulder should move closer to the far hand target",
  );
});

test("rises through bent legs when a hand is pulled upward", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 50, y: 145 },
      rightKnee: { x: 150, y: 145 },
      leftFoot: { x: 62, y: 180 },
      rightFoot: { x: 138, y: 180 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 150, y: -60 },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 1,
    "left foot should stay planted while the body rises",
  );
  assert.ok(
    distance(nextPose.joints.rightFoot, pose.joints.rightFoot) < 1,
    "right foot should stay planted while the body rises",
  );
  assert.ok(
    nextPose.joints.pelvis.y < pose.joints.pelvis.y - 20,
    "hand pull should raise the pelvis through leg extension",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) >
      distance(pose.joints.leftHip, pose.joints.leftFoot),
    "left leg should extend as the body rises",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) >
      distance(pose.joints.rightHip, pose.joints.rightFoot),
    "right leg should extend as the body rises",
  );
  assert.ok(
    Math.max(
      distance(nextPose.joints.leftHip, nextPose.joints.leftFoot),
      distance(nextPose.joints.rightHip, nextPose.joints.rightFoot),
    ) >
      model.thigh + model.shin - 1,
    "hand pull should rise until a planted leg reaches its natural extension limit",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) <=
      model.thigh + model.shin + 0.001,
    "left leg should not stretch past its bone lengths",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) <=
      model.thigh + model.shin + 0.001,
    "right leg should not stretch past its bone lengths",
  );
});

test("rises through the available planted foot when the other leg is already extended", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 50, y: 145 },
      rightKnee: { x: 126, y: 154 },
      leftFoot: { x: 62, y: 180 },
      rightFoot: { x: 137, y: 208 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target: { x: 64, y: -60 },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 1,
    "available planted foot should stay anchored while the body rises",
  );
  assert.ok(
    nextPose.joints.pelvis.y < pose.joints.pelvis.y - 15,
    "hand pull should raise the pelvis through the available planted leg",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) >
      distance(pose.joints.leftHip, pose.joints.leftFoot),
    "available planted leg should extend as the body rises",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) <=
      model.thigh + model.shin + 0.001,
    "available planted leg should not stretch past its bone lengths",
  );
});

test("rises through the available planted foot when a hand is pulled diagonally upward", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 50, y: 145 },
      rightKnee: { x: 126, y: 154 },
      leftFoot: { x: 62, y: 180 },
      rightFoot: { x: 137, y: 208 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -35, y: -20 },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 1,
    "available planted foot should stay anchored during a diagonal upward hand pull",
  );
  assert.ok(
    nextPose.joints.pelvis.y < pose.joints.pelvis.y - 10,
    "diagonal upward hand pull should raise the pelvis through leg extension",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) >
      distance(pose.joints.leftHip, pose.joints.leftFoot),
    "available planted leg should extend during a diagonal upward hand pull",
  );
});

test("prefers the same-side planted foot when a hand pull rises from a lunge stance", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 65 },
      rightElbow: { x: 135, y: 80 },
      leftHand: { x: 45, y: 85 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 46, y: 112 },
      rightKnee: { x: 128, y: 148 },
      leftFoot: { x: 54, y: 150 },
      rightFoot: { x: 146, y: 195 },
    },
  };
  const leftLegBefore = distance(pose.joints.leftHip, pose.joints.leftFoot);

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -35, y: -45 },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 1,
    "same-side planted foot should stay anchored while the hand pull lifts the body",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) >
      leftLegBefore + 20,
    "same-side planted leg should visibly extend as the body rises",
  );
  assert.ok(
    nextPose.joints.pelvis.y < pose.joints.pelvis.y - 15,
    "same-side planted leg should drive the pelvis upward",
  );
});

test("keeps hand lunge core mode through a shallow upward follow frame", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 65 },
      rightElbow: { x: 135, y: 80 },
      leftHand: { x: 45, y: 85 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 46, y: 112 },
      rightKnee: { x: 128, y: 148 },
      leftFoot: { x: 54, y: 150 },
      rightFoot: { x: 146, y: 195 },
    },
  };

  const autoResolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -80, y: -2 },
    },
    model,
  );
  const lockedResolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -80, y: -2 },
      previousMode: "core",
    },
    model,
  );

  assert.ok(
    distance(lockedResolution.pose.joints.leftHip, pose.joints.leftFoot) >
      distance(autoResolution.pose.joints.leftHip, pose.joints.leftFoot) + 10,
    "locked lunge mode should keep extending the same-side planted leg instead of flipping to the horizontal reach mode",
  );
  assert.equal(lockedResolution.mode, "core");
});

test("keeps joint core drag mode near the parallel threshold", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 50, y: 145 },
      rightKnee: { x: 150, y: 145 },
      leftFoot: { x: 62, y: 180 },
      rightFoot: { x: 138, y: 180 },
    },
  };
  const target = { x: 49, y: 114 };

  assert.equal(
    resolveSkeletonJointDragWithMode(
      pose,
      {
        jointName: "leftElbow",
        target,
      },
      model,
    ).mode,
    "pose",
  );
  assert.equal(
    resolveSkeletonJointDragWithMode(
      pose,
      {
        jointName: "leftElbow",
        target,
        previousMode: "core",
      },
      model,
    ).mode,
    "core",
  );
});

test("does not core-drag a below-horizontal elbow pushed horizontally", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 160, y: 44 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 195, y: 48 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const resolution = resolveSkeletonJointDragWithMode(
    pose,
    {
      jointName: "rightElbow",
      target: { x: 180, y: 44 },
    },
    model,
  );

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(resolution.pose.joints.torso, pose.joints.torso);
  assert.deepEqual(resolution.pose.joints.pelvis, pose.joints.pelvis);
});

test("does not core-drag a below-horizontal straight hand pushed horizontally", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 159.9, y: 42.13 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 194.82, y: 43.99 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const resolution = resolveSkeletonPoseDragWithMode(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 184.82, y: 43.99 },
    },
    model,
  );

  assert.equal(resolution.mode, "pose");
  assert.deepEqual(resolution.pose.joints.torso, pose.joints.torso);
  assert.deepEqual(resolution.pose.joints.pelvis, pose.joints.pelvis);
});

test("smoothly ramps body lean near the far hand reach threshold", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 128, y: 142 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 126, y: 185 },
    },
  };

  const beforeThresholdPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -15, y: 25 },
    },
    model,
  );
  const afterThresholdPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "leftHand",
      target: { x: -35, y: 25 },
    },
    model,
  );
  const pelvisShift = pose.joints.pelvis.x - afterThresholdPose.joints.pelvis.x;

  assert.ok(
    pelvisShift > 0,
    "body lean should begin after the far hand reach threshold",
  );
  assert.ok(
    pelvisShift < 22,
    "body lean should not jump abruptly when the hand passes the reach threshold",
  );
  assert.ok(
    afterThresholdPose.joints.pelvis.x <= beforeThresholdPose.joints.pelvis.x,
    "body lean should increase toward the reach direction as the target moves farther",
  );
});

test("keeps repeated hand drag frames stable when they use the same drag start pose", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };
  const dragInput = {
    endpointName: "rightHand",
    target: { x: 220, y: 24 },
  };

  const firstPose = resolveSkeletonPoseDrag(pose, dragInput, model);
  const repeatedPose = resolveSkeletonPoseDrag(pose, dragInput, model);

  assert.ok(
    distance(repeatedPose.joints.rightShoulder, firstPose.joints.rightShoulder) <
      0.001,
    "repeated move frames from the same drag start should not keep moving the shoulder",
  );
  assert.ok(
    Math.abs(
      distance(repeatedPose.joints.rightShoulder, repeatedPose.joints.rightElbow) -
        model.upperArm,
    ) < 0.01,
    "repeated move frames should preserve upper-arm length",
  );
  assert.ok(
    Math.abs(
      distance(repeatedPose.joints.rightElbow, repeatedPose.joints.rightHand) -
        model.forearm,
    ) < 0.01,
    "repeated move frames should preserve forearm length",
  );
});

test("extends a reachable foot without rotating or shifting the core", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightFoot",
      target: { x: 198, y: 169 },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, pose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
  assert.deepEqual(nextPose.joints.rightHip, pose.joints.rightHip);
});

test("leans the core toward a far foot drag", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightFoot",
      target: { x: 220, y: 224 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.pelvis.x - nextPose.joints.torso.x > 2,
    "right foot reach should pull the pelvis right so the torso axis leans",
  );
  assert.ok(
    nextPose.joints.pelvis.x - nextPose.joints.torso.x < 5,
    "leg reach should not over-rotate the torso axis",
  );
  assert.ok(
    nextPose.joints.neck.x < nextPose.joints.pelvis.x,
    "upper body should stay opposite the reaching foot",
  );
});

test("raises the body into an overhead hand reach until both legs extend", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 150, y: -80 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.pelvis.y < pose.joints.pelvis.y,
    "overhead hand reach should raise the pelvis instead of leaving the body pinned",
  );
  assert.ok(
    distance(nextPose.joints.leftFoot, pose.joints.leftFoot) < 1,
    "left foot should stay anchored while the body rises",
  );
  assert.ok(
    distance(nextPose.joints.rightFoot, pose.joints.rightFoot) < 1,
    "right foot should stay anchored while the body rises",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) >
      model.thigh + model.shin - 1,
    "left leg should extend to its natural reach limit during an overhead reach",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) >
      model.thigh + model.shin - 1,
    "right leg should extend to its natural reach limit during an overhead reach",
  );
  assert.ok(
    distance(nextPose.joints.leftHip, nextPose.joints.leftFoot) <=
      model.thigh + model.shin + 0.001,
    "left leg should not stretch past its bone lengths",
  );
  assert.ok(
    distance(nextPose.joints.rightHip, nextPose.joints.rightFoot) <=
      model.thigh + model.shin + 0.001,
    "right leg should not stretch past its bone lengths",
  );
  assert.ok(
    nextPose.joints.rightShoulder.y < pose.joints.rightShoulder.y,
    "overhead hand reach should raise the shoulder toward the target",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.rightShoulder) -
        distance(pose.joints.neck, pose.joints.rightShoulder),
    ) < 0.001,
    "overhead shoulder follow should rotate around the neck without stretching",
  );
  assert.ok(
    distance(nextPose.joints.rightShoulder, nextPose.joints.rightHand) >
      model.upperArm + model.forearm - 0.001,
    "overhead hand reach should allow the arm to straighten fully",
  );
  assert.ok(
    distance(nextPose.joints.rightShoulder, nextPose.joints.rightHand) <=
      model.upperArm + model.forearm + 0.001,
    "overhead hand reach should not stretch the arm past its bone lengths",
  );
});

test("keeps the pelvis quiet when a hand is pulled diagonally", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointName: "rightHand",
      target: { x: 210, y: 85 },
    },
    model,
  );

  assert.ok(
    distance(nextPose.joints.pelvis, pose.joints.pelvis) < 2,
    "diagonal hand pulls should not drag the pelvis across the wall",
  );
  assert.ok(
    distance(nextPose.joints.rightShoulder, { x: 210, y: 85 }) <
      distance(pose.joints.rightShoulder, { x: 210, y: 85 }),
    "diagonal hand pulls should rotate the shoulder toward the hand",
  );
  assert.ok(
    distance(nextPose.joints.torso, pose.joints.torso) < 0.5,
    "diagonal hand pulls should not rotate the torso",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.rightShoulder) -
        distance(pose.joints.neck, pose.joints.rightShoulder),
    ) < 0.001,
    "hand pulls should rotate the shoulder around the neck without stretching",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.torso) -
        distance(pose.joints.neck, pose.joints.torso),
    ) < 0.001,
    "hand pulls should not stretch the upper spine",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.torso, nextPose.joints.pelvis) -
        distance(pose.joints.torso, pose.joints.pelvis),
    ) < 0.001,
    "hand pulls should not stretch the lower spine",
  );
});

test("rotates the head with the neck and sternum without stretching the spine", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    headToNeck: 22,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 110, y: 15 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonHeadDrag(
    pose,
    {
      target: { x: 125, y: 0 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.head.y < nextPose.joints.neck.y,
    "dragging above the neck should keep the head separated above the neck",
  );
  assert.ok(
    nextPose.joints.neck.x > pose.joints.neck.x,
    "neck should rotate toward a lateral head lift",
  );
  assert.ok(
    nextPose.joints.torso.x > pose.joints.torso.x,
    "sternum should rotate toward a lateral head lift",
  );
  assert.ok(
    distance(nextPose.joints.head, nextPose.joints.neck) -
      model.headToNeck <
      0.001,
    "head should keep its natural neck distance",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.neck, nextPose.joints.torso) -
        distance(pose.joints.neck, pose.joints.torso),
    ) < 0.001,
    "head pulls should not stretch the upper spine",
  );
  assert.ok(
    Math.abs(
      distance(nextPose.joints.torso, nextPose.joints.pelvis) -
        distance(pose.joints.torso, pose.joints.pelvis),
    ) < 0.001,
    "head pulls should not stretch the lower spine",
  );
  assert.deepEqual(nextPose.joints.pelvis, pose.joints.pelvis);
});

test("prevents head dragging into an upside-down lower hemisphere", () => {
  const model = {
    height: 170,
    wingspan: 170,
    scale: 1,
    headRadius: 10,
    headToNeck: 22,
    neckToTorso: 10,
    torsoToPelvis: 30,
    shoulderWidth: 40,
    hipWidth: 30,
    upperArm: 40,
    forearm: 35,
    thigh: 60,
    shin: 50,
  };
  const pose = {
    joints: {
      head: { x: 100, y: 20 },
      neck: { x: 100, y: 35 },
      torso: { x: 100, y: 55 },
      pelvis: { x: 100, y: 85 },
      leftShoulder: { x: 80, y: 40 },
      rightShoulder: { x: 120, y: 40 },
      leftElbow: { x: 60, y: 75 },
      rightElbow: { x: 140, y: 75 },
      leftHand: { x: 55, y: 110 },
      rightHand: { x: 145, y: 110 },
      leftHip: { x: 85, y: 100 },
      rightHip: { x: 115, y: 100 },
      leftKnee: { x: 65, y: 155 },
      rightKnee: { x: 135, y: 155 },
      leftFoot: { x: 62, y: 205 },
      rightFoot: { x: 138, y: 205 },
    },
  };

  const nextPose = resolveSkeletonHeadDrag(
    pose,
    {
      target: { x: 100, y: 120 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.head.y < nextPose.joints.neck.y,
    "head should stay above the neck even when dragged downward",
  );
  assert.ok(
    Math.abs(nextPose.joints.head.x - nextPose.joints.neck.x) < 0.001,
    "straight downward head drags should not snap the head sideways",
  );
  assert.ok(
    Math.abs(nextPose.joints.neck.x - pose.joints.neck.x) < 0.001,
    "straight downward head drags should not snap the upper spine sideways",
  );
  assert.ok(
    distance(nextPose.joints.head, nextPose.joints.neck) -
      model.headToNeck <
      0.001,
    "head should keep its natural neck distance while clamped",
  );
});
