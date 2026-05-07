const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSkeletonPoseHistory,
  pushSkeletonPoseHistory,
  redoSkeletonPoseHistory,
  undoSkeletonPoseHistory,
} = require("./skeletonPoseHistory.js");

function snapshot(id) {
  return {
    scale: id,
    pose: {
      joints: {
        head: { x: id, y: id },
        neck: { x: id, y: id },
        torso: { x: id, y: id },
        pelvis: { x: id, y: id },
        leftShoulder: { x: id, y: id },
        rightShoulder: { x: id, y: id },
        leftElbow: { x: id, y: id },
        rightElbow: { x: id, y: id },
        leftHand: { x: id, y: id },
        rightHand: { x: id, y: id },
        leftHip: { x: id, y: id },
        rightHip: { x: id, y: id },
        leftKnee: { x: id, y: id },
        rightKnee: { x: id, y: id },
        leftFoot: { x: id, y: id },
        rightFoot: { x: id, y: id },
      },
    },
  };
}

test("undo and redo move between committed skeleton pose snapshots", () => {
  const initial = snapshot(1);
  const moved = snapshot(2);
  const history = pushSkeletonPoseHistory(
    createSkeletonPoseHistory(),
    initial,
  );

  const undone = undoSkeletonPoseHistory(history, moved);
  assert.deepEqual(undone.snapshot, initial);
  assert.equal(undone.history.past.length, 0);
  assert.deepEqual(undone.history.future, [moved]);

  const redone = redoSkeletonPoseHistory(undone.history, initial);
  assert.deepEqual(redone.snapshot, moved);
  assert.deepEqual(redone.history.past, [initial]);
  assert.equal(redone.history.future.length, 0);
});

test("committing a new skeleton move clears redo history", () => {
  const initial = snapshot(1);
  const moved = snapshot(2);
  const changedDirection = snapshot(3);
  const history = pushSkeletonPoseHistory(
    createSkeletonPoseHistory(),
    initial,
  );
  const undone = undoSkeletonPoseHistory(history, moved);

  const nextHistory = pushSkeletonPoseHistory(
    undone.history,
    changedDirection,
  );

  assert.deepEqual(nextHistory.past, [changedDirection]);
  assert.equal(nextHistory.future.length, 0);
});
