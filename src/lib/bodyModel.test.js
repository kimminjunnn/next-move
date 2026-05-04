require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const { createSkeletonBodyModel } = require("./bodyModel.ts");

const BASE_PIXELS_PER_CM = 2;
const SHOULDER_WIDTH_RATIO = 0.23;
const UPPER_ARM_RATIO = 0.1725;
const FOREARM_RATIO = 0.1585;
const HAND_RATIO = 0.0575;
const THIGH_RATIO = 0.2405;
const SHIN_RATIO = 0.252;

function nearlyEqual(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 0.001,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

test("sizes arm bones from wingspan while preserving average arm segment proportions", () => {
  const height = 170;
  const wingspan = 190;
  const scale = 1;
  const model = createSkeletonBodyModel(
    { height, wingspan, wingspanMode: "custom" },
    scale,
  );

  const shoulderWidthCm = height * SHOULDER_WIDTH_RATIO;
  const oneSideReachCm = (wingspan - shoulderWidthCm) / 2;
  const armRatioTotal = UPPER_ARM_RATIO + FOREARM_RATIO + HAND_RATIO;
  const expectedUpperArm =
    oneSideReachCm * (UPPER_ARM_RATIO / armRatioTotal) * BASE_PIXELS_PER_CM;
  const expectedForearm =
    oneSideReachCm *
    ((FOREARM_RATIO + HAND_RATIO) / armRatioTotal) *
    BASE_PIXELS_PER_CM;

  nearlyEqual(model.upperArm, expectedUpperArm, "upper arm length");
  nearlyEqual(model.forearm, expectedForearm, "forearm reach length");
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
  assert.equal(longReachModel.thigh, regularReachModel.thigh);
  assert.equal(longReachModel.shin, regularReachModel.shin);
  assert.equal(longReachModel.shoulderWidth, regularReachModel.shoulderWidth);
  assert.ok(longReachModel.upperArm > regularReachModel.upperArm);
  assert.ok(longReachModel.forearm > regularReachModel.forearm);
});
