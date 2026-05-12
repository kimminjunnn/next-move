const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getSkeletonCharacterOverlayOpacity,
} = require("./skeletonCharacterVisibility.js");

test("keeps the skeleton fully visible when no character is shown", () => {
  assert.deepEqual(
    getSkeletonCharacterOverlayOpacity({
      activeControlId: null,
      characterVisible: false,
    }),
    {
      bone: 1,
      body: 1,
      character: 0,
      head: 1,
      inactiveEndpoint: 1,
      inactiveJoint: 1,
    },
  );
});

test("hides skeleton guides when the character is visible and idle", () => {
  assert.deepEqual(
    getSkeletonCharacterOverlayOpacity({
      activeControlId: null,
      characterVisible: true,
    }),
    {
      bone: 0,
      body: 0,
      character: 1,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    },
  );
});

test("keeps skeleton guides hidden while dragging a character control", () => {
  assert.deepEqual(
    getSkeletonCharacterOverlayOpacity({
      activeControlId: "leftHand",
      characterVisible: true,
    }),
    {
      bone: 0,
      body: 0,
      character: 1,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    },
  );
});

test("uses a lighter character opacity for the minimal skeleton renderer", () => {
  assert.deepEqual(
    getSkeletonCharacterOverlayOpacity({
      activeControlId: null,
      characterRenderStyle: "minimalSkeleton",
      characterVisible: true,
    }),
    {
      bone: 0,
      body: 0,
      character: 0.72,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    },
  );
});

test("keeps the active minimal skeleton readable while dragging", () => {
  assert.deepEqual(
    getSkeletonCharacterOverlayOpacity({
      activeControlId: "rightHand",
      characterRenderStyle: "minimalSkeleton",
      characterVisible: true,
    }),
    {
      bone: 0,
      body: 0,
      character: 0.88,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    },
  );
});

test("keeps the stickman character more present than the thin minimal skeleton", () => {
  [
    "stickmanCharacter",
    "stickmanCharacterNavy",
    "stickmanCharacterBlack",
  ].forEach((characterRenderStyle) => {
    assert.deepEqual(
      getSkeletonCharacterOverlayOpacity({
        activeControlId: null,
        characterRenderStyle,
        characterVisible: true,
      }),
      {
        bone: 0,
        body: 0,
        character: 0.94,
        head: 0,
        inactiveEndpoint: 0,
        inactiveJoint: 0,
      },
    );
  });
});
