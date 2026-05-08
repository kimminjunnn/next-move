import type { Point2D } from "../types/geometry";
import type { SimulationPhoto, SimulationPhotoTransform } from "../types/simulation";

type ImageDimensions = {
  width: number;
  height: number;
};

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

export function resolveRenderedPhotoRect(
  photo: SimulationPhoto,
  transform: SimulationPhotoTransform,
  viewportWidth: number,
  viewportHeight: number,
) {
  const baseDimensions = getBaseDimensions(photo, viewportWidth, viewportHeight);
  const absoluteOffsets = resolveAbsoluteOffsets(
    transform,
    baseDimensions.width,
    baseDimensions.height,
    viewportWidth,
    viewportHeight,
  );
  const renderedWidth = baseDimensions.width * transform.scale;
  const renderedHeight = baseDimensions.height * transform.scale;

  return {
    left: viewportWidth / 2 - renderedWidth / 2 + absoluteOffsets.translateX,
    top: viewportHeight / 2 - renderedHeight / 2 + absoluteOffsets.translateY,
    width: renderedWidth,
    height: renderedHeight,
  };
}

export function viewportPointToPhotoPoint(
  point: Point2D,
  photo: SimulationPhoto,
  transform: SimulationPhotoTransform,
  viewportWidth: number,
  viewportHeight: number,
): Point2D {
  const renderedRect = resolveRenderedPhotoRect(
    photo,
    transform,
    viewportWidth,
    viewportHeight,
  );

  return {
    x:
      clampValue(
        (point.x - renderedRect.left) / renderedRect.width,
        0,
        1,
      ) * photo.width,
    y:
      clampValue(
        (point.y - renderedRect.top) / renderedRect.height,
        0,
        1,
      ) * photo.height,
  };
}

export function photoPointToViewportPoint(
  point: Point2D,
  photo: SimulationPhoto,
  transform: SimulationPhotoTransform,
  viewportWidth: number,
  viewportHeight: number,
): Point2D {
  const renderedRect = resolveRenderedPhotoRect(
    photo,
    transform,
    viewportWidth,
    viewportHeight,
  );

  return {
    x: renderedRect.left + (point.x / photo.width) * renderedRect.width,
    y: renderedRect.top + (point.y / photo.height) * renderedRect.height,
  };
}

export function analysisPointToPhotoPoint(
  point: Point2D,
  analysisImage: ImageDimensions,
  photo: SimulationPhoto,
): Point2D {
  return {
    x: (point.x / analysisImage.width) * photo.width,
    y: (point.y / analysisImage.height) * photo.height,
  };
}

export function photoPointToAnalysisPoint(
  point: Point2D,
  photo: SimulationPhoto,
  analysisImage: ImageDimensions,
): Point2D {
  return {
    x: (point.x / photo.width) * analysisImage.width,
    y: (point.y / photo.height) * analysisImage.height,
  };
}

export function analysisPointToViewportPoint(
  point: Point2D,
  analysisImage: ImageDimensions,
  photo: SimulationPhoto,
  transform: SimulationPhotoTransform,
  viewportWidth: number,
  viewportHeight: number,
): Point2D {
  return photoPointToViewportPoint(
    analysisPointToPhotoPoint(point, analysisImage, photo),
    photo,
    transform,
    viewportWidth,
    viewportHeight,
  );
}

export function viewportPointToAnalysisPoint(
  point: Point2D,
  photo: SimulationPhoto,
  analysisImage: ImageDimensions,
  transform: SimulationPhotoTransform,
  viewportWidth: number,
  viewportHeight: number,
): Point2D {
  return photoPointToAnalysisPoint(
    viewportPointToPhotoPoint(
      point,
      photo,
      transform,
      viewportWidth,
      viewportHeight,
    ),
    photo,
    analysisImage,
  );
}
