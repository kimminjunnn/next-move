export type SkeletonCharacterVisualRenderStyle =
  | "minimalSkeleton"
  | "stickmanCharacter"
  | "stickmanCharacterNavy"
  | "stickmanCharacterBlack";

export type SkeletonCharacterVisualProfileInput = {
  headRadius: number;
  renderStyle: SkeletonCharacterVisualRenderStyle;
  scale: number;
};

export type SkeletonCharacterVisualProfile = {
  activeJointRadius: number;
  activeStrokeWidth: number;
  bodyStrokeColor: string;
  eyeRadius: number;
  faceStrokeColor: string;
  faceStrokeWidth: number;
  headFillColor: string;
  headCenterTowardNeckRatio: number;
  headRadiusMultiplier: number;
  headStrokeColor: string;
  headStrokeWidth: number;
  jointFillColor: string;
  jointRadius: number;
  mouthLengthRatio: number;
  shadowStrokeColor: string;
  showFaceMarks: boolean;
  showIdleJoints: boolean;
  strokeWidth: number;
  useContinuousLimbPaths: boolean;
};

export function getSkeletonCharacterVisualProfile(
  input: SkeletonCharacterVisualProfileInput,
): SkeletonCharacterVisualProfile;
