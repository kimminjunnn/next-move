import type {
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

export function clampValue(value: number, min: number, max: number): number {
  "worklet";

  return Math.min(Math.max(value, min), max);
}

export function getCoverScale(
  photo: SimulationPhoto,
  viewportWidth: number,
  viewportHeight: number,
) {
  return Math.max(viewportWidth / photo.width, viewportHeight / photo.height);
}

export function getBaseDimensions(
  photo: SimulationPhoto,
  viewportWidth: number,
  viewportHeight: number,
) {
  const coverScale = getCoverScale(photo, viewportWidth, viewportHeight);

  return {
    width: photo.width * coverScale,
    height: photo.height * coverScale,
  };
}

export function getMaxOffsets(
  scale: number,
  baseWidth: number,
  baseHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  "worklet";

  const renderedWidth = baseWidth * scale;
  const renderedHeight = baseHeight * scale;

  return {
    maxOffsetX: Math.max(0, (renderedWidth - viewportWidth) / 2),
    maxOffsetY: Math.max(0, (renderedHeight - viewportHeight) / 2),
  };
}

export function clampTranslations(
  translateX: number,
  translateY: number,
  scale: number,
  baseWidth: number,
  baseHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  "worklet";

  const { maxOffsetX, maxOffsetY } = getMaxOffsets(
    scale,
    baseWidth,
    baseHeight,
    viewportWidth,
    viewportHeight,
  );

  return {
    x: clampValue(translateX, -maxOffsetX, maxOffsetX),
    y: clampValue(translateY, -maxOffsetY, maxOffsetY),
  };
}

export function resolveTransformRatios(
  translateX: number,
  translateY: number,
  scale: number,
  baseWidth: number,
  baseHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): SimulationPhotoTransform {
  const { maxOffsetX, maxOffsetY } = getMaxOffsets(
    scale,
    baseWidth,
    baseHeight,
    viewportWidth,
    viewportHeight,
  );

  return {
    scale,
    offsetXRatio: maxOffsetX > 0 ? translateX / maxOffsetX : 0,
    offsetYRatio: maxOffsetY > 0 ? translateY / maxOffsetY : 0,
  };
}

export function resolveAbsoluteOffsets(
  transform: SimulationPhotoTransform,
  baseWidth: number,
  baseHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const { maxOffsetX, maxOffsetY } = getMaxOffsets(
    transform.scale,
    baseWidth,
    baseHeight,
    viewportWidth,
    viewportHeight,
  );

  return {
    translateX: maxOffsetX * transform.offsetXRatio,
    translateY: maxOffsetY * transform.offsetYRatio,
  };
}
