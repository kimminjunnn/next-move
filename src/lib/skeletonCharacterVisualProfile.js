function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSkeletonCharacterVisualProfile({ headRadius, renderStyle, scale }) {
  const isStickman =
    renderStyle === "stickmanCharacter" ||
    renderStyle === "stickmanCharacterNavy" ||
    renderStyle === "stickmanCharacterBlack";

  if (isStickman) {
    const palette =
      renderStyle === "stickmanCharacterNavy"
        ? {
            fill: "rgba(16,42,67,0.96)",
            outline: "rgba(255,248,230,0.76)",
          }
        : renderStyle === "stickmanCharacterBlack"
          ? {
              fill: "rgba(32,32,32,0.94)",
              outline: "rgba(255,246,220,0.72)",
            }
        : {
            fill: "rgba(7,94,99,0.94)",
            outline: "rgba(255,246,220,0.72)",
          };

    return {
      activeJointRadius: clampNumber(scale * 14, 9.5, 15),
      activeStrokeWidth: clampNumber(scale * 12.4, 8.5, 13.2),
      bodyStrokeColor: palette.fill,
      eyeRadius: 0,
      faceStrokeColor: "rgba(20,20,20,0.42)",
      faceStrokeWidth: clampNumber(scale * 2.45, 1.7, 2.9),
      headFillColor: palette.fill,
      headCenterTowardNeckRatio: 0,
      headRadiusMultiplier: 1.28,
      headStrokeColor: palette.outline,
      headStrokeWidth: clampNumber(scale * 2.2, 1.6, 2.8),
      jointFillColor: palette.fill,
      jointRadius: clampNumber(scale * 10.8, 7.4, 12.2),
      mouthLengthRatio: 0,
      shadowStrokeColor: palette.outline,
      showFaceMarks: false,
      showIdleJoints: false,
      strokeWidth: clampNumber(scale * 10.2, 7.2, 11.4),
      useContinuousLimbPaths: true,
    };
  }

  return {
    activeJointRadius: clampNumber(scale * 7.8, 4.8, 8.5),
    activeStrokeWidth: clampNumber(scale * 4.2, 2.3, 4.4),
    bodyStrokeColor: "rgba(249,246,238,0.72)",
    eyeRadius: clampNumber(headRadius * 0.055, 1.2, 2.2),
    faceStrokeColor: "rgba(45,34,28,0.64)",
    faceStrokeWidth: clampNumber(scale * 1.55, 1.05, 1.8),
    headFillColor: "rgba(249,246,238,0.3)",
    headCenterTowardNeckRatio: 0.08,
    headRadiusMultiplier: 1,
    headStrokeColor: "rgba(26,24,22,0.74)",
    headStrokeWidth: clampNumber(scale * 2.9, 1.55, 3.2) + 2,
    jointFillColor: "rgba(249,246,238,0.76)",
    jointRadius: clampNumber(scale * 4.6, 2.8, 5.5),
    mouthLengthRatio: 0.15,
    shadowStrokeColor: "rgba(20,20,20,0.54)",
    showFaceMarks: true,
    showIdleJoints: true,
    strokeWidth: clampNumber(scale * 2.9, 1.55, 3.2),
    useContinuousLimbPaths: false,
  };
}

module.exports = {
  getSkeletonCharacterVisualProfile,
};
