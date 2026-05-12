export type SkeletonCharacterOverlayOpacityInput = {
  activeControlId: string | null;
  characterRenderStyle?:
    | "minimalSkeleton"
    | "stickmanCharacter"
    | "stickmanCharacterNavy"
    | "stickmanCharacterBlack"
    | "rupaRig"
    | "none";
  characterVisible: boolean;
};

export type SkeletonCharacterOverlayOpacity = {
  bone: number;
  body: number;
  character: number;
  head: number;
  inactiveEndpoint: number;
  inactiveJoint: number;
};

export function getSkeletonCharacterOverlayOpacity(
  input: SkeletonCharacterOverlayOpacityInput,
): SkeletonCharacterOverlayOpacity;
