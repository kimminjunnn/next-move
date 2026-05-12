const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isRasterCharacterRenderStyle,
  isStickmanCharacterRenderStyle,
} = require("./skeletonCharacterRenderStyle.js");

test("uses raster character transforms only for the Rupa rig renderer", () => {
  assert.equal(isRasterCharacterRenderStyle("rupaRig"), true);

  [
    "minimalSkeleton",
    "stickmanCharacter",
    "stickmanCharacterNavy",
    "stickmanCharacterBlack",
    "none",
  ].forEach((renderStyle) => {
    assert.equal(isRasterCharacterRenderStyle(renderStyle), false);
  });
});

test("groups every stickman material under one render style predicate", () => {
  [
    "stickmanCharacter",
    "stickmanCharacterNavy",
    "stickmanCharacterBlack",
  ].forEach((renderStyle) => {
    assert.equal(isStickmanCharacterRenderStyle(renderStyle), true);
  });

  ["minimalSkeleton", "rupaRig", "none"].forEach((renderStyle) => {
    assert.equal(isStickmanCharacterRenderStyle(renderStyle), false);
  });
});
