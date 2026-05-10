function getSkeletonCharacterOverlayOpacity({
  activeControlId,
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
