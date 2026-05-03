require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
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
