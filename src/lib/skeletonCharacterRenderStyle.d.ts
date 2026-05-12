export type SkeletonCharacterRenderStyleName =
  | "minimalSkeleton"
  | "stickmanCharacter"
  | "stickmanCharacterNavy"
  | "stickmanCharacterBlack"
  | "rupaRig"
  | "none";

export function isRasterCharacterRenderStyle(
  renderStyle: string | undefined,
): renderStyle is "rupaRig";

export function isStickmanCharacterRenderStyle(
  renderStyle: string | undefined,
): renderStyle is
  | "stickmanCharacter"
  | "stickmanCharacterNavy"
  | "stickmanCharacterBlack";

export function isVectorCharacterRenderStyle(
  renderStyle: string | undefined,
): renderStyle is
  | "minimalSkeleton"
  | "stickmanCharacter"
  | "stickmanCharacterNavy"
  | "stickmanCharacterBlack";
