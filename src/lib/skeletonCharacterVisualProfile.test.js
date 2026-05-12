const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getSkeletonCharacterVisualProfile,
} = require("./skeletonCharacterVisualProfile.js");

test("makes the stickman character visibly thicker than the thin skeleton", () => {
  const minimal = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "minimalSkeleton",
    scale: 1,
  });
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.ok(
    stickman.strokeWidth > minimal.strokeWidth,
    "stickman body stroke should be thicker",
  );
  assert.ok(
    stickman.jointRadius > minimal.jointRadius,
    "stickman joints should read as character endpoints",
  );
  assert.equal(stickman.showFaceMarks, false);
});

test("keeps stickman face details off by default", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(stickman.showFaceMarks, false);
  assert.equal(stickman.eyeRadius, 0);
  assert.equal(stickman.mouthLengthRatio, 0);
});

test("makes the default stickman close to character art thickness", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.ok(
    stickman.strokeWidth >= 9.5,
    "stickman should be much thicker than a skeletal guide",
  );
  assert.ok(
    stickman.activeStrokeWidth >= 12,
    "active limbs should still read as the same thick character",
  );
});

test("uses one visual material for stickman head and limbs", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(typeof stickman.bodyStrokeColor, "string");
  assert.equal(stickman.bodyStrokeColor, stickman.headFillColor);
  assert.equal(stickman.jointFillColor, stickman.headFillColor);
  assert.notEqual(stickman.headStrokeColor, stickman.headFillColor);
  assert.equal(stickman.shadowStrokeColor, stickman.headStrokeColor);
});

test("uses a teal stickman material with a bright outline for mixed climbing walls", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(stickman.bodyStrokeColor, "rgba(7,94,99,0.94)");
  assert.equal(stickman.headFillColor, "rgba(7,94,99,0.94)");
  assert.equal(stickman.jointFillColor, "rgba(7,94,99,0.94)");
  assert.equal(stickman.headStrokeColor, "rgba(255,246,220,0.72)");
  assert.equal(stickman.shadowStrokeColor, "rgba(255,246,220,0.72)");
  assert.ok(stickman.headStrokeWidth <= 3);
});

test("offers a navy stickman alternative with the same bright outline", () => {
  const navy = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacterNavy",
    scale: 1,
  });

  assert.equal(navy.bodyStrokeColor, "rgba(16,42,67,0.96)");
  assert.equal(navy.headFillColor, "rgba(16,42,67,0.96)");
  assert.equal(navy.jointFillColor, "rgba(16,42,67,0.96)");
  assert.equal(navy.headStrokeColor, "rgba(255,248,230,0.76)");
  assert.equal(navy.shadowStrokeColor, "rgba(255,248,230,0.76)");
});

test("offers a black stickman alternative with the same bright outline", () => {
  const black = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacterBlack",
    scale: 1,
  });

  assert.equal(black.bodyStrokeColor, "rgba(32,32,32,0.94)");
  assert.equal(black.headFillColor, "rgba(32,32,32,0.94)");
  assert.equal(black.jointFillColor, "rgba(32,32,32,0.94)");
  assert.equal(black.headStrokeColor, "rgba(255,246,220,0.72)");
  assert.equal(black.shadowStrokeColor, "rgba(255,246,220,0.72)");
});

test("keeps stickman as a unified head and body silhouette", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(stickman.showFaceMarks, false);
  assert.equal(stickman.bodyStrokeColor, stickman.headFillColor);
});

test("gives the stickman a larger head without idle joint markers", () => {
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(stickman.headRadiusMultiplier, 1.28);
  assert.equal(stickman.showIdleJoints, false);
  assert.equal(stickman.useContinuousLimbPaths, true);
});

test("keeps the stickman head floating above the neck", () => {
  const minimal = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "minimalSkeleton",
    scale: 1,
  });
  const stickman = getSkeletonCharacterVisualProfile({
    headRadius: 20,
    renderStyle: "stickmanCharacter",
    scale: 1,
  });

  assert.equal(stickman.headCenterTowardNeckRatio, 0);
  assert.ok(
    stickman.headCenterTowardNeckRatio < minimal.headCenterTowardNeckRatio,
    "stickman head should not be pulled down into the neck",
  );
});
