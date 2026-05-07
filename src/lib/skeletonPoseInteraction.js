export function shouldAllowSkeletonPinchScale(
  mode,
  allowPinchScaleInSimulation,
) {
  return mode === "calibrating" || allowPinchScaleInSimulation;
}

export function getSkeletonOverlayPointerEvents(allowEmptySpacePinchScale) {
  return allowEmptySpacePinchScale ? "auto" : "box-none";
}
