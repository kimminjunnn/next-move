require("sucrase/register");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { PNG } = require("pngjs");

require.extensions[".png"] = (module, filename) => {
  module.exports = filename;
};

const {
  computeCharacterPartTransforms,
  computeAnchorPartTransform,
  computeLimbPartTransform,
  computeLimbPartAnchorPoints,
  getPoseHeadFacing,
  getRupaHeadFacing,
  getRupaTailSwayDegrees,
  getRotationDegrees,
  RUPA_BACK_CHARACTER_PARTS,
  RUPA_BACK_CHARACTER_VARIANTS,
  getRupaCharacterVariant,
  sortRigPartsByZIndex,
} = require("./rupaCharacterRig.ts");

const pose = {
  joints: {
    head: { x: 50, y: 10 },
    neck: { x: 50, y: 35 },
    torso: { x: 50, y: 80 },
    pelvis: { x: 50, y: 130 },
    leftShoulder: { x: 25, y: 40 },
    rightShoulder: { x: 75, y: 40 },
    leftElbow: { x: 10, y: 70 },
    rightElbow: { x: 90, y: 70 },
    leftHand: { x: 8, y: 110 },
    rightHand: { x: 92, y: 110 },
    leftHip: { x: 35, y: 130 },
    rightHip: { x: 65, y: 130 },
    leftKnee: { x: 30, y: 175 },
    rightKnee: { x: 70, y: 175 },
    leftFoot: { x: 28, y: 220 },
    rightFoot: { x: 72, y: 220 },
  },
};

const model = {
  height: 170,
  wingspan: 170,
  scale: 1,
  headRadius: 20,
  neckToTorso: 45,
  torsoToPelvis: 50,
  shoulderWidth: 50,
  hipWidth: 30,
  upperArm: 35,
  forearm: 40,
  thigh: 45,
  shin: 45,
};

function nearlyEqual(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 0.001,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function getOpaqueBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];

      if (alpha > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    height: maxY - minY + 1,
    width: maxX - minX + 1,
  };
}

function countLightFootPixelsByHalf(image) {
  let bottom = 0;
  let top = 0;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4;
      const alpha = image.data[index + 3];

      if (alpha <= 20) {
        continue;
      }

      const red = image.data[index];
      const green = image.data[index + 1];
      const blue = image.data[index + 2];

      if (red > 150 && green > 90 && blue < 100) {
        if (y < image.height / 2) {
          top += 1;
        } else {
          bottom += 1;
        }
      }
    }
  }

  return { bottom, top };
}

test("computes a limb part rotation and length from its joint pair", () => {
  const transform = computeLimbPartTransform(
    {
      id: "leftUpperArm",
      kind: "limb",
      source: 1,
      from: "leftShoulder",
      to: "leftElbow",
      nativeSize: { width: 100, height: 30 },
      zIndex: 10,
    },
    {
      joints: {
        ...pose.joints,
        leftShoulder: { x: 10, y: 20 },
        leftElbow: { x: 10, y: 70 },
      },
    },
    model,
  );

  nearlyEqual(transform.rotationDeg, 90, "rotation");
  nearlyEqual(transform.width, 50, "width follows joint distance");
  nearlyEqual(transform.height, 15, "height keeps native aspect ratio");
  assert.deepEqual(transform.center, { x: 10, y: 45 });
});

test("applies limb length and thickness scaling", () => {
  const transform = computeLimbPartTransform(
    {
      id: "rightForearm",
      kind: "limb",
      source: 1,
      from: "rightElbow",
      to: "rightHand",
      nativeSize: { width: 100, height: 20 },
      lengthScale: 1.2,
      thicknessScale: 1.5,
      zIndex: 20,
    },
    {
      joints: {
        ...pose.joints,
        rightElbow: { x: 20, y: 20 },
        rightHand: { x: 70, y: 20 },
      },
    },
    model,
  );

  nearlyEqual(transform.rotationDeg, 0, "rotation");
  nearlyEqual(transform.width, 60, "scaled length");
  nearlyEqual(transform.height, 18, "scaled thickness");
  assert.deepEqual(transform.center, { x: 45, y: 20 });
});

test("uses limb endpoint offsets before computing rotation and length", () => {
  const anchors = computeLimbPartAnchorPoints(
    {
      id: "leftUpperArm",
      kind: "limb",
      source: 1,
      from: "leftShoulder",
      to: "leftElbow",
      fromOffset: { x: 0, y: 20 },
      toOffset: { x: 10, y: 0 },
      nativeSize: { width: 100, height: 30 },
      zIndex: 10,
    },
    {
      joints: {
        ...pose.joints,
        leftShoulder: { x: 10, y: 10 },
        leftElbow: { x: 60, y: 10 },
      },
    },
    model,
  );

  assert.deepEqual(anchors.from, { x: 10, y: 30 });
  assert.deepEqual(anchors.to, { x: 70, y: 10 });

  const transform = computeLimbPartTransform(
    {
      id: "leftUpperArm",
      kind: "limb",
      source: 1,
      from: "leftShoulder",
      to: "leftElbow",
      fromOffset: { x: 0, y: 20 },
      toOffset: { x: 10, y: 0 },
      nativeSize: { width: 100, height: 30 },
      zIndex: 10,
    },
    {
      joints: {
        ...pose.joints,
        leftShoulder: { x: 10, y: 10 },
        leftElbow: { x: 60, y: 10 },
      },
    },
    model,
  );

  nearlyEqual(transform.center.x, 40, "offset limb center x");
  nearlyEqual(transform.center.y, 20, "offset limb center y");
  nearlyEqual(transform.width, Math.hypot(60, -20), "offset limb length");
  nearlyEqual(transform.rotationDeg, -18.43494882292201, "offset limb rotation");
});

test("can keep limb length based on skeleton joints while using visual socket offsets", () => {
  const transform = computeLimbPartTransform(
    {
      id: "leftUpperArm",
      kind: "limb",
      source: 1,
      from: "leftShoulder",
      to: "leftElbow",
      fromOffset: { x: 0, y: 35 },
      lengthBasis: "joints",
      nativeSize: { width: 100, height: 30 },
      zIndex: 10,
    },
    {
      joints: {
        ...pose.joints,
        leftShoulder: { x: 20, y: 20 },
        leftElbow: { x: 20, y: 55 },
      },
    },
    model,
  );

  nearlyEqual(transform.width, 35, "length follows skeleton joint distance");
  assert.deepEqual(transform.center, { x: 20, y: 55 });
});

test("scales limb endpoint offsets with the skeleton model scale", () => {
  const anchors = computeLimbPartAnchorPoints(
    {
      id: "rightUpperArm",
      kind: "limb",
      source: 1,
      from: "rightShoulder",
      to: "rightElbow",
      fromOffset: { x: 8, y: 12 },
      toOffset: { x: -4, y: 2 },
      nativeSize: { width: 100, height: 30 },
      zIndex: 10,
    },
    {
      joints: {
        ...pose.joints,
        rightShoulder: { x: 100, y: 40 },
        rightElbow: { x: 130, y: 80 },
      },
    },
    {
      ...model,
      scale: 1.5,
    },
  );

  assert.deepEqual(anchors.from, { x: 112, y: 58 });
  assert.deepEqual(anchors.to, { x: 124, y: 83 });
});

test("computes anchored part size and offset from a single skeleton joint", () => {
  const transform = computeAnchorPartTransform(
    {
      id: "chalkBag",
      kind: "anchor",
      source: 1,
      anchor: "pelvis",
      nativeSize: { width: 80, height: 100 },
      sizeBasis: "hipWidth",
      sizeMultiplier: 1.2,
      offset: { x: 0, y: 12 },
      zIndex: 70,
    },
    pose,
    model,
  );

  nearlyEqual(transform.width, 36, "width from hip basis");
  nearlyEqual(transform.height, 45, "height keeps native aspect ratio");
  assert.deepEqual(transform.center, { x: 50, y: 142 });
});

test("clamps anchored part rotation when the head control flips too far", () => {
  const transform = computeAnchorPartTransform(
    {
      id: "headBack",
      kind: "anchor",
      source: 1,
      anchor: "head",
      nativeSize: { width: 100, height: 100 },
      rotation: { from: "neck", to: "head", offsetDeg: 90 },
      rotationClampDeg: { min: -55, max: 55 },
      sizeBasis: "headRadius",
      sizeMultiplier: 1,
      zIndex: 40,
    },
    {
      joints: {
        ...pose.joints,
        head: { x: 100, y: 200 },
        neck: { x: 100, y: 100 },
      },
    },
    model,
  );

  nearlyEqual(transform.rotationDeg, 55, "clamped upside-down head rotation");
});

test("rotates anchored part offsets in local rig space", () => {
  const transform = computeAnchorPartTransform(
    {
      id: "leftEar",
      kind: "anchor",
      source: 1,
      anchor: "head",
      nativeSize: { width: 80, height: 100 },
      sizeBasis: "headRadius",
      sizeMultiplier: 1,
      offset: { x: 10, y: 0 },
      rotation: { from: "neck", to: "head" },
      zIndex: 40,
    },
    {
      joints: {
        ...pose.joints,
        head: { x: 100, y: 100 },
        neck: { x: 100, y: 50 },
      },
    },
    model,
  );

  nearlyEqual(transform.rotationDeg, 90, "rotation");
  nearlyEqual(transform.center.x, 100, "rotated center x");
  nearlyEqual(transform.center.y, 110, "rotated center y");
});

test("uses rotation offsets to normalize vertical head anchors", () => {
  const transform = computeAnchorPartTransform(
    {
      id: "headBack",
      kind: "anchor",
      source: 1,
      anchor: "head",
      nativeSize: { width: 100, height: 100 },
      sizeBasis: "headRadius",
      sizeMultiplier: 1,
      offset: { x: -12, y: 4 },
      rotation: { from: "neck", to: "head", offsetDeg: 90 },
      zIndex: 40,
    },
    {
      joints: {
        ...pose.joints,
        head: { x: 100, y: 100 },
        neck: { x: 100, y: 150 },
      },
    },
    model,
  );

  nearlyEqual(transform.rotationDeg, 0, "default back head rotation");
  nearlyEqual(transform.center.x, 88, "default local offset x");
  nearlyEqual(transform.center.y, 104, "default local offset y");
});

test("keeps Rupa head upright in the default back pose", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );
  const head = transforms.find((part) => part.id === "headBack");

  nearlyEqual(head.rotationDeg, 0, "headBack rotation");
});

test("chooses pose head facing from active hand and arm intent", () => {
  assert.equal(getPoseHeadFacing(pose, "leftHand"), "left");
  assert.equal(getPoseHeadFacing(pose, "leftElbow"), "left");
  assert.equal(getPoseHeadFacing(pose, "rightHand"), "right");
  assert.equal(getPoseHeadFacing(pose, "rightElbow"), "right");
});

test("chooses pose head facing from asymmetric hand reach", () => {
  assert.equal(
    getPoseHeadFacing({
      joints: {
        ...pose.joints,
        leftHand: { x: 4, y: 42 },
        rightHand: { x: 78, y: 112 },
      },
    }),
    "left",
  );
  assert.equal(
    getPoseHeadFacing({
      joints: {
        ...pose.joints,
        leftHand: { x: 22, y: 112 },
        rightHand: { x: 104, y: 42 },
      },
    }),
    "right",
  );
});

test("keeps pose head facing back when hand reach is balanced", () => {
  assert.equal(getPoseHeadFacing(pose), "back");
  assert.equal(
    getPoseHeadFacing({
      joints: {
        ...pose.joints,
        leftHand: { x: 12, y: 72 },
        rightHand: { x: 88, y: 72 },
      },
    }),
    "back",
  );
});

test("keeps the Rupa head facing export compatible with pose head facing", () => {
  assert.equal(getRupaHeadFacing(pose, "leftHand"), "left");
  assert.equal(getRupaHeadFacing(pose, "rightElbow"), "right");
  assert.equal(getRupaHeadFacing(pose), getPoseHeadFacing(pose));
});

test("renders only the Rupa head variant for the selected facing", () => {
  const leftFacing = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
    { facing: "left" },
  );
  const rightFacing = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
    { facing: "right" },
  );
  const backFacing = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
    { facing: "back" },
  );

  assert.ok(leftFacing.some((part) => part.id === "headLeft"));
  assert.ok(!leftFacing.some((part) => part.id === "headRight"));
  assert.ok(!leftFacing.some((part) => part.id === "headBack"));
  assert.ok(rightFacing.some((part) => part.id === "headRight"));
  assert.ok(!rightFacing.some((part) => part.id === "headLeft"));
  assert.ok(backFacing.some((part) => part.id === "headBack"));
});

test("keeps every Rupa raster asset aligned with the rig manifest", () => {
  const seenSources = new Set();

  for (const part of RUPA_BACK_CHARACTER_PARTS) {
    if (seenSources.has(part.source)) {
      continue;
    }

    seenSources.add(part.source);

    const image = PNG.sync.read(fs.readFileSync(part.source));

    assert.equal(image.width, part.nativeSize.width, `${part.id} width`);
    assert.equal(image.height, part.nativeSize.height, `${part.id} height`);
    assert.equal(image.data.length, image.width * image.height * 4);
    assert.equal(image.data[3], 0);
  }
});

test("exposes interchangeable Rupa character variants with matching rig contracts", () => {
  assert.deepEqual(
    RUPA_BACK_CHARACTER_VARIANTS.map((variant) => variant.id),
    ["illustrated", "cartoon", "mischief", "lumi", "bori"],
  );

  const illustrated = getRupaCharacterVariant("illustrated");
  const cartoon = getRupaCharacterVariant("cartoon");
  const mischief = getRupaCharacterVariant("mischief");
  const lumi = getRupaCharacterVariant("lumi");
  const bori = getRupaCharacterVariant("bori");

  assert.equal(illustrated.label, "일러스트");
  assert.equal(cartoon.label, "카툰");
  assert.equal(mischief.label, "시크");
  assert.equal(lumi.label, "루미");
  assert.equal(bori.label, "보리");

  for (const variant of [cartoon, mischief, lumi, bori]) {
    assert.equal(illustrated.parts.length, variant.parts.length);

    for (const [index, illustratedPart] of illustrated.parts.entries()) {
      const variantPart = variant.parts[index];

      assert.equal(variantPart.id, illustratedPart.id);
      assert.equal(variantPart.kind, illustratedPart.kind);
      assert.deepEqual(variantPart.nativeSize, illustratedPart.nativeSize);
      assert.notEqual(variantPart.source, illustratedPart.source);

      const image = PNG.sync.read(fs.readFileSync(variantPart.source));

      assert.equal(image.width, variantPart.nativeSize.width);
      assert.equal(image.height, variantPart.nativeSize.height);
      assert.equal(image.data[3], 0);
    }
  }
});

test("keeps every Rupa limb variant horizontal enough for skeleton rigging", () => {
  const limbIds = new Set([
    "leftUpperArm",
    "rightUpperArm",
    "leftForearm",
    "rightForearm",
    "leftThigh",
    "rightThigh",
    "leftShin",
    "rightShin",
  ]);

  for (const variant of RUPA_BACK_CHARACTER_VARIANTS) {
    for (const part of variant.parts) {
      if (!limbIds.has(part.id)) {
        continue;
      }

      const image = PNG.sync.read(fs.readFileSync(part.source));
      const bounds = getOpaqueBounds(image);
      const boundsRatio = bounds.width / bounds.height;
      const widthCoverage = bounds.width / part.nativeSize.width;

      assert.ok(
        boundsRatio >= 1.45,
        `${variant.id} ${part.id} must be horizontal, received ${bounds.width}x${bounds.height}`,
      );
      assert.ok(
        widthCoverage >= 0.75,
        `${variant.id} ${part.id} must fill enough of its native width, received ${bounds.width}/${part.nativeSize.width}`,
      );
    }
  }
});

test("adds pose-driven sway to the Rupa tail without changing its base rig", () => {
  const leftReachPose = {
    joints: {
      ...pose.joints,
      leftHand: { x: -25, y: 48 },
      rightHand: { x: 74, y: 110 },
    },
  };
  const tailSwayDeg = getRupaTailSwayDegrees(leftReachPose);
  const tail = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    leftReachPose,
    model,
    { tailSwayDeg },
  ).find((part) => part.id === "tail");

  assert.ok(tailSwayDeg > 0);
  assert.ok(tail.rotationDeg > 42);
  assert.ok(tail.rotationDeg <= 60);
});

test("keeps Rupa upper arm sockets close enough to the shoulders to stay attached", () => {
  const leftUpperArm = RUPA_BACK_CHARACTER_PARTS.find(
    (part) => part.id === "leftUpperArm",
  );
  const rightUpperArm = RUPA_BACK_CHARACTER_PARTS.find(
    (part) => part.id === "rightUpperArm",
  );

  const leftAnchors = computeLimbPartAnchorPoints(leftUpperArm, pose, model);
  const rightAnchors = computeLimbPartAnchorPoints(rightUpperArm, pose, model);

  assert.ok(leftAnchors.from.y > pose.joints.leftShoulder.y);
  assert.ok(rightAnchors.from.y > pose.joints.rightShoulder.y);
  assert.ok(
    Math.abs(leftAnchors.from.x - pose.joints.leftShoulder.x) <=
      model.shoulderWidth * 0.16,
  );
  assert.ok(
    Math.abs(rightAnchors.from.x - pose.joints.rightShoulder.x) <=
      model.shoulderWidth * 0.16,
  );
});

test("keeps Rupa arm proportions close to the natural leg part proportions", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );
  const leftUpperArm = transforms.find((part) => part.id === "leftUpperArm");
  const leftForearm = transforms.find((part) => part.id === "leftForearm");
  const rightUpperArm = transforms.find((part) => part.id === "rightUpperArm");
  const rightForearm = transforms.find((part) => part.id === "rightForearm");
  const leftThigh = transforms.find((part) => part.id === "leftThigh");
  const leftShin = transforms.find((part) => part.id === "leftShin");
  const legMaxHeight = Math.max(leftThigh.height, leftShin.height);
  const legMaxWidth = Math.max(leftThigh.width, leftShin.width);

  assert.ok(leftUpperArm.height >= leftForearm.height * 0.94);
  assert.ok(leftUpperArm.height <= leftForearm.height * 1.02);
  assert.ok(rightUpperArm.height >= rightForearm.height * 0.94);
  assert.ok(rightUpperArm.height <= rightForearm.height * 1.02);
  assert.ok(leftUpperArm.width >= leftForearm.width * 0.88);
  assert.ok(rightUpperArm.width >= rightForearm.width * 0.88);
  assert.ok(
    leftUpperArm.width * leftUpperArm.height <=
      leftForearm.width * leftForearm.height * 1.04,
  );
  assert.ok(
    rightUpperArm.width * rightUpperArm.height <=
      rightForearm.width * rightForearm.height * 1.04,
  );
  assert.ok(leftUpperArm.height <= legMaxHeight * 0.72);
  assert.ok(rightUpperArm.height <= legMaxHeight * 0.72);
  assert.ok(leftUpperArm.width <= legMaxWidth * 0.98);
  assert.ok(rightUpperArm.width <= legMaxWidth * 0.98);
});

test("keeps Rupa upper arms controlled in an overhead reach pose", () => {
  const overheadPose = {
    joints: {
      ...pose.joints,
      leftShoulder: { x: 55, y: 78 },
      leftElbow: { x: 55, y: 43 },
      leftHand: { x: 55, y: 3 },
      rightShoulder: { x: 70, y: 80 },
      rightElbow: { x: 94, y: 55 },
      rightHand: { x: 122, y: 28 },
    },
  };
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    overheadPose,
    model,
  );
  const leftUpperArm = transforms.find((part) => part.id === "leftUpperArm");
  const leftForearm = transforms.find((part) => part.id === "leftForearm");
  const leftThigh = transforms.find((part) => part.id === "leftThigh");

  assert.ok(leftUpperArm.width <= leftForearm.width * 1.08);
  assert.ok(leftUpperArm.height <= leftForearm.height * 1.04);
  assert.ok(leftUpperArm.height <= leftThigh.height * 0.72);
});

test("keeps Rupa feet attached at the ankle while extending toes outward", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );

  for (const [footId, kneeId] of [
    ["leftFoot", "leftKnee"],
    ["rightFoot", "rightKnee"],
  ]) {
    const foot = transforms.find((part) => part.id === footId);
    const footJoint = pose.joints[footId];
    const kneeJoint = pose.joints[kneeId];
    const legLength = Math.hypot(
      footJoint.x - kneeJoint.x,
      footJoint.y - kneeJoint.y,
    );
    const direction = {
      x: (footJoint.x - kneeJoint.x) / legLength,
      y: (footJoint.y - kneeJoint.y) / legLength,
    };
    const centerOffsetAlongLeg =
      (foot.center.x - footJoint.x) * direction.x +
      (foot.center.y - footJoint.y) * direction.y;
    const offsetRatio = centerOffsetAlongLeg / foot.width;

    assert.ok(
      offsetRatio >= -0.02,
      `${footId} should not pull the foot backward past the ankle`,
    );
    assert.ok(
      offsetRatio <= 0.08,
      `${footId} should keep its ankle attached to the shin, received ${offsetRatio}`,
    );
  }
});

test("keeps Rupa feet perpendicular to the lower legs at the ankles", () => {
  const directionalPose = {
    joints: {
      ...pose.joints,
      leftKnee: { x: 42, y: 178 },
      leftFoot: { x: 10, y: 204 },
      rightKnee: { x: 58, y: 178 },
      rightFoot: { x: 90, y: 204 },
    },
  };
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    directionalPose,
    model,
  );
  const leftFoot = transforms.find((part) => part.id === "leftFoot");
  const rightFoot = transforms.find((part) => part.id === "rightFoot");

  nearlyEqual(
    leftFoot.rotationDeg,
    getRotationDegrees(
      directionalPose.joints.leftKnee,
      directionalPose.joints.leftFoot,
    ) + 90,
    "left foot turns perpendicular from the left lower leg",
  );
  nearlyEqual(
    rightFoot.rotationDeg,
    getRotationDegrees(
      directionalPose.joints.rightKnee,
      directionalPose.joints.rightFoot,
    ) + 90,
    "right foot turns perpendicular from the right lower leg",
  );
});

test("anchors Rupa foot heels at the ankle instead of centering the whole foot", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );

  for (const [footId, toeDirectionOffsetDeg] of [
    ["leftFoot", 0],
    ["rightFoot", 180],
  ]) {
    const foot = transforms.find((part) => part.id === footId);
    const footJoint = pose.joints[footId];
    const toeRadians =
      ((foot.rotationDeg + toeDirectionOffsetDeg) * Math.PI) / 180;
    const toeDirection = {
      x: Math.cos(toeRadians),
      y: Math.sin(toeRadians),
    };
    const centerOffsetTowardToes =
      (foot.center.x - footJoint.x) * toeDirection.x +
      (foot.center.y - footJoint.y) * toeDirection.y;
    const offsetRatio = centerOffsetTowardToes / foot.width;

    assert.ok(
      offsetRatio >= 0.26,
      `${footId} should place the heel near the ankle and shift the foot body toward the toes`,
    );
    assert.ok(
      offsetRatio <= 0.44,
      `${footId} should not detach too far from the ankle, received ${offsetRatio}`,
    );
  }
});

test("keeps Rupa foot top surfaces visually above the ankle wraps", () => {
  const footIds = new Set(["leftFoot", "rightFoot"]);

  for (const variant of RUPA_BACK_CHARACTER_VARIANTS) {
    for (const part of variant.parts) {
      if (!footIds.has(part.id)) {
        continue;
      }

      const image = PNG.sync.read(fs.readFileSync(part.source));
      const lightPixels = countLightFootPixelsByHalf(image);

      assert.ok(
        lightPixels.top > lightPixels.bottom,
        `${variant.id} ${part.id} should not render upside down`,
      );
    }
  }
});

test("keeps Rupa tail compact and attached behind the pelvis", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );
  const tail = transforms.find((part) => part.id === "tail");
  const torso = transforms.find((part) => part.id === "torsoBack");
  const pelvis = pose.joints.pelvis;

  assert.ok(tail.width <= torso.width * 1.55);
  assert.ok(tail.center.x - pelvis.x >= torso.width * 0.25);
  assert.ok(tail.center.x - pelvis.x <= torso.width * 0.55);
  assert.ok(Math.abs(tail.center.y - pelvis.y) <= torso.height * 0.16);
});

test("keeps Rupa head and torso balanced within the full character silhouette", () => {
  const transforms = computeCharacterPartTransforms(
    RUPA_BACK_CHARACTER_PARTS,
    pose,
    model,
  );
  const head = transforms.find((part) => part.id === "headBack");
  const torso = transforms.find((part) => part.id === "torsoBack");

  assert.ok(torso.width <= model.shoulderWidth * 1.25);
  assert.ok(torso.height >= torso.width * 1.65);
  assert.ok(torso.height >= (model.neckToTorso + model.torsoToPelvis) * 1);
  assert.ok(head.width <= torso.width * 1.08);
  assert.ok(head.height <= torso.height * 0.62);
});

test("sorts character rig parts by z-index without mutating the input", () => {
  const parts = [
    { id: "headBack", zIndex: 40 },
    { id: "tail", zIndex: 5 },
    { id: "torsoBack", zIndex: 30 },
  ];

  assert.deepEqual(
    sortRigPartsByZIndex(parts).map((part) => part.id),
    ["tail", "torsoBack", "headBack"],
  );
  assert.deepEqual(
    parts.map((part) => part.id),
    ["headBack", "tail", "torsoBack"],
  );
});
