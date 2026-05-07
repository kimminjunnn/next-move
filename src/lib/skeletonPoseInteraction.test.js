const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getSkeletonOverlayPointerEvents,
  shouldAllowSkeletonPinchScale,
} = require("./skeletonPoseInteraction.js");

test("allows skeleton pinch scale in simulation only when explicitly enabled", () => {
  assert.equal(shouldAllowSkeletonPinchScale("calibrating", false), true);
  assert.equal(shouldAllowSkeletonPinchScale("simulating", false), false);
  assert.equal(shouldAllowSkeletonPinchScale("simulating", true), true);
});

test("uses a touchable overlay when empty-space pinch scaling is enabled", () => {
  assert.equal(getSkeletonOverlayPointerEvents(false), "box-none");
  assert.equal(getSkeletonOverlayPointerEvents(true), "auto");
});
