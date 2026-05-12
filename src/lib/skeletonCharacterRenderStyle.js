function isRasterCharacterRenderStyle(renderStyle) {
  return renderStyle === "rupaRig";
}

function isStickmanCharacterRenderStyle(renderStyle) {
  return (
    renderStyle === "stickmanCharacter" ||
    renderStyle === "stickmanCharacterNavy" ||
    renderStyle === "stickmanCharacterBlack"
  );
}

function isVectorCharacterRenderStyle(renderStyle) {
  return (
    renderStyle === "minimalSkeleton" ||
    isStickmanCharacterRenderStyle(renderStyle)
  );
}

module.exports = {
  isRasterCharacterRenderStyle,
  isStickmanCharacterRenderStyle,
  isVectorCharacterRenderStyle,
};
