require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  BASE_PIXELS_PER_CM,
  FOREARM_RATIO,
  HAND_RATIO,
  SHIN_RATIO,
  SHOULDER_WIDTH_RATIO,
  THIGH_RATIO,
  UPPER_ARM_RATIO,
  clampSkeletonScale,
  createSkeletonBodyModel,
} = require("./bodyModel.ts");

function nearlyEqual(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 0.001,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

test("sizes arm bones from wingspan while preserving average arm segment proportions", () => {
  const height = 170;
  const wingspan = 190;
  const model = createSkeletonBodyModel(
    { height, wingspan, wingspanMode: "custom" },
    1,
  );
  const shoulderWidthCm = height * SHOULDER_WIDTH_RATIO;
  const oneSideReachCm = (wingspan - shoulderWidthCm) / 2;
  const armRatioTotal = UPPER_ARM_RATIO + FOREARM_RATIO + HAND_RATIO;

  nearlyEqual(
    model.upperArm,
    oneSideReachCm * (UPPER_ARM_RATIO / armRatioTotal) * BASE_PIXELS_PER_CM,
    "upper arm length",
  );
  nearlyEqual(
    model.forearm,
    oneSideReachCm *
      ((FOREARM_RATIO + HAND_RATIO) / armRatioTotal) *
      BASE_PIXELS_PER_CM,
    "forearm reach length",
  );
  nearlyEqual(
    model.upperArm + model.forearm,
    oneSideReachCm * BASE_PIXELS_PER_CM,
    "one-side hand reach",
  );
});

test("keeps non-arm skeleton segments tied to average height ratios", () => {
  const height = 170;
  const scale = 0.5;
  const regularReachModel = createSkeletonBodyModel(
    { height, wingspan: 170, wingspanMode: "custom" },
    scale,
  );
  const longReachModel = createSkeletonBodyModel(
    { height, wingspan: 195, wingspanMode: "custom" },
    scale,
  );

  nearlyEqual(
    regularReachModel.thigh,
    height * THIGH_RATIO * BASE_PIXELS_PER_CM * scale,
    "thigh length",
  );
  nearlyEqual(
    regularReachModel.shin,
    height * SHIN_RATIO * BASE_PIXELS_PER_CM * scale,
    "shin length",
  );
  nearlyEqual(
    regularReachModel.headToNeck,
    regularReachModel.headRadius * 2.08,
    "head-to-neck distance",
  );
  assert.equal(longReachModel.thigh, regularReachModel.thigh);
  assert.equal(longReachModel.shin, regularReachModel.shin);
  assert.equal(longReachModel.shoulderWidth, regularReachModel.shoulderWidth);
  assert.ok(longReachModel.upperArm > regularReachModel.upperArm);
  assert.ok(longReachModel.forearm > regularReachModel.forearm);
});

test("clamps skeleton scale to supported bounds", () => {
  assert.equal(clampSkeletonScale(0.1), 0.2);
  assert.equal(clampSkeletonScale(0.75), 0.75);
  assert.equal(clampSkeletonScale(2), 1.25);
});
