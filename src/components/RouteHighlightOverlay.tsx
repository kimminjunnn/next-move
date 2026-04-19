import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Polyline } from "react-native-svg";

import { photoPointToViewportPoint } from "../lib/simulationViewport";
import type {
  RouteSelectionResult,
  SimulationDetectedObject,
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

type RouteHighlightOverlayProps = {
  photo: SimulationPhoto;
  objects: SimulationDetectedObject[];
  route: RouteSelectionResult | null;
  selectedStartHoldObjectId: string | null;
  transform: SimulationPhotoTransform;
  viewportHeight: number;
  viewportWidth: number;
};

export function RouteHighlightOverlay({
  photo,
  objects,
  route,
  selectedStartHoldObjectId,
  transform,
  viewportHeight,
  viewportWidth,
}: RouteHighlightOverlayProps) {
  const mappedObjects = useMemo(
    () =>
      objects.map((object) => ({
        ...object,
        viewportContour: object.contour.map((point) =>
          photoPointToViewportPoint(
            point,
            photo,
            transform,
            viewportWidth,
            viewportHeight,
          ),
        ),
        viewportCenter: photoPointToViewportPoint(
          object.center,
          photo,
          transform,
          viewportWidth,
          viewportHeight,
        ),
        isIncluded: route ? route.includedObjectIds.includes(object.id) : false,
        isSelectedStart: object.id === selectedStartHoldObjectId,
      })),
    [objects, photo, route, selectedStartHoldObjectId, transform, viewportHeight, viewportWidth],
  );

  const accentColor = route?.routeColor.hex ?? "#ffb37a";

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg height="100%" width="100%">
        {mappedObjects.map((object) => {
          const points = object.viewportContour
            .map((point) => `${point.x},${point.y}`)
            .join(" ");
          const strokeColor = object.isIncluded
            ? accentColor
            : object.kind === "hold"
              ? "rgba(255,255,255,0.72)"
              : "rgba(149,216,255,0.72)";
          const fillColor = object.isIncluded
            ? "rgba(255,140,56,0.08)"
            : object.kind === "hold"
              ? "rgba(255,255,255,0.02)"
              : "rgba(149,216,255,0.05)";

          return (
            <G key={object.id}>
              <Polyline
                fill={fillColor}
                points={points}
                stroke="rgba(15,15,15,0.92)"
                strokeLinejoin="round"
                strokeWidth={object.isIncluded ? 7 : 5.5}
              />
              <Polyline
                fill={fillColor}
                points={points}
                stroke={strokeColor}
                strokeLinejoin="round"
                strokeWidth={object.isIncluded ? 3.4 : 2}
              />

              {object.isSelectedStart ? (
                <Circle
                  cx={object.viewportCenter.x}
                  cy={object.viewportCenter.y}
                  fill={accentColor}
                  r={8}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
