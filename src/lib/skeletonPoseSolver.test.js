require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resolveSkeletonCoreDrag,
  resolveSkeletonHeadDrag,
  resolveSkeletonJointDrag,
  resolveSkeletonPoseDrag,
} = require("./skeletonPoseSolver.ts");

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

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
      jointId: "rightKnee",
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
      jointId: "rightKnee",
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
      jointId: "rightElbow",
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

test("treats a hand push toward the body along a straight arm like a core drag", () => {
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
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointId: "rightHand",
      target: {
        x: pose.joints.rightHand.x + delta.x,
        y: pose.joints.rightHand.y + delta.y,
      },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, expectedPose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, expectedPose.joints.pelvis);
  assert.deepEqual(nextPose.joints.rightShoulder, expectedPose.joints.rightShoulder);
  assert.ok(
    distance(nextPose.joints.rightHand, expectedPose.joints.rightHand) < 0.001,
    "parallel straight-arm hand drag should keep the same hand anchoring as a core drag",
  );
  assert.ok(
    distance(nextPose.joints.rightElbow, expectedPose.joints.rightElbow) < 0.001,
    "parallel straight-arm hand drag should resolve the elbow exactly like a core drag",
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
      endpointId: "rightHand",
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

test("continues as a core drag after a bent arm becomes straight during a hand drag", () => {
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
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointId: "rightHand",
      target: {
        x: straightHand.x + delta.x,
        y: straightHand.y + delta.y,
      },
    },
    model,
  );

  assert.deepEqual(nextPose.joints.torso, expectedPose.joints.torso);
  assert.deepEqual(nextPose.joints.pelvis, expectedPose.joints.pelvis);
  assert.ok(
    distance(nextPose.joints.rightHand, expectedPose.joints.rightHand) < 0.001,
    "hand drag should use only the movement after straightening as the core drag delta",
  );
  assert.ok(
    distance(nextPose.joints.rightElbow, expectedPose.joints.rightElbow) < 0.001,
    "hand drag after straightening should preserve the core-drag arm solve",
  );
});

test("treats a foot push toward the body along a straight leg like a core drag", () => {
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
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointId: "rightFoot",
      target: {
        x: pose.joints.rightFoot.x + delta.x,
        y: pose.joints.rightFoot.y + delta.y,
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
    "parallel straight-leg foot push should keep the same foot anchoring as a core drag",
  );
  assert.ok(
    distance(nextPose.joints.rightKnee, expectedPose.joints.rightKnee) < 0.001,
    "parallel straight-leg foot push should resolve the knee exactly like a core drag",
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
      endpointId: "rightFoot",
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

test("continues as a core drag after a bent leg becomes straight during a foot drag", () => {
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
  const expectedPose = resolveSkeletonCoreDrag(
    pose,
    {
      delta,
    },
    model,
  );

  const nextPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointId: "rightFoot",
      target: {
        x: straightFoot.x + delta.x,
        y: straightFoot.y + delta.y,
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
  assert.ok(
    distance(nextPose.joints.rightFoot, expectedPose.joints.rightFoot) < 0.001,
    "foot drag should use only the movement after straightening as the core drag delta",
  );
  assert.ok(
    distance(nextPose.joints.rightKnee, expectedPose.joints.rightKnee) < 0.1,
    "foot drag after straightening should preserve the core-drag leg solve",
  );
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
      jointId: "rightKnee",
      target: { x: 80, y: 156.57 },
    },
    model,
  );
  const nextPose = resolveSkeletonPoseDrag(
    dropKneePose,
    {
      endpointId: "rightFoot",
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
      jointId: "rightKnee",
      target: { x: 80, y: 156.57 },
    },
    model,
  );
  const nextPose = resolveSkeletonPoseDrag(
    dropKneePose,
    {
      endpointId: "rightHand",
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
      endpointId: "rightHand",
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
      endpointId: "rightHand",
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
      endpointId: "leftHand",
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
      endpointId: "leftHand",
      target: { x: -15, y: 25 },
    },
    model,
  );
  const afterThresholdPose = resolveSkeletonPoseDrag(
    pose,
    {
      endpointId: "leftHand",
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
    endpointId: "rightHand",
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
      endpointId: "rightFoot",
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
      endpointId: "rightFoot",
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
      endpointId: "rightHand",
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
      endpointId: "rightHand",
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
      head: { x: 110, y: 28 },
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
      target: { x: 125, y: 8 },
    },
    model,
  );

  assert.ok(
    nextPose.joints.head.y < pose.joints.head.y,
    "dragging above the neck should raise the head",
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
      model.headRadius * 1.55 <
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
