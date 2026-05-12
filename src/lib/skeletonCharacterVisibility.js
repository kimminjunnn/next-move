const {
  isStickmanCharacterRenderStyle,
} = require("./skeletonCharacterRenderStyle.js");

function getSkeletonCharacterOverlayOpacity({
  activeControlId,
  characterRenderStyle,
  characterVisible,
}) {
  if (!characterVisible) {
    return {
      bone: 1,
      body: 1,
      character: 0,
      head: 1,
      inactiveEndpoint: 1,
      inactiveJoint: 1,
    };
  }

  if (characterRenderStyle === "minimalSkeleton") {
    return {
      bone: 0,
      body: 0,
      character: activeControlId ? 0.88 : 0.72,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    };
  }

  if (isStickmanCharacterRenderStyle(characterRenderStyle)) {
    return {
      bone: 0,
      body: 0,
      character: activeControlId ? 1 : 0.94,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    };
  }

  if (activeControlId) {
    return {
      bone: 0,
      body: 0,
      character: 1,
      head: 0,
      inactiveEndpoint: 0,
      inactiveJoint: 0,
    };
  }

  return {
    bone: 0,
    body: 0,
    character: 1,
    head: 0,
    inactiveEndpoint: 0,
    inactiveJoint: 0,
  };
}

module.exports = {
  getSkeletonCharacterOverlayOpacity,
};
