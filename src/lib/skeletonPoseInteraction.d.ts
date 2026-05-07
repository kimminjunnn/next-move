export function shouldAllowSkeletonPinchScale(
  mode: "calibrating" | "simulating",
  allowPinchScaleInSimulation: boolean,
): boolean;

export function getSkeletonOverlayPointerEvents(
  allowEmptySpacePinchScale: boolean,
): "auto" | "box-none";
