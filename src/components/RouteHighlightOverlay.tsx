import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Polygon } from "react-native-svg";

import { analysisPointToViewportPoint } from "../lib/simulationViewport";
import type {
  RouteSelectionResult,
  SimulationDetectedObject,
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

type RouteHighlightOverlayProps = {
  analysisImage: {
    width: number;
    height: number;
  };
  displayMode: "all-holds" | "route";
  photo: SimulationPhoto;
  objects: SimulationDetectedObject[];
  route: RouteSelectionResult | null;
  selectedStartHoldObjectId: string | null;
  transform: SimulationPhotoTransform;
  viewportHeight: number;
  viewportWidth: number;
};

export function RouteHighlightOverlay({
  analysisImage,
  displayMode,
  photo,
  objects,
  route,
  selectedStartHoldObjectId,
  transform,
  viewportHeight,
  viewportWidth,
}: RouteHighlightOverlayProps) {
  const isRouteMode = displayMode === "route";
  const mappedObjects = useMemo(
    () =>
      objects.map((object) => ({
        ...object,
        viewportContour: object.contour.map((point) =>
          analysisPointToViewportPoint(
            point,
            analysisImage,
            photo,
            transform,
            viewportWidth,
            viewportHeight,
          ),
        ),
        viewportCenter: analysisPointToViewportPoint(
          object.center,
          analysisImage,
          photo,
          transform,
          viewportWidth,
          viewportHeight,
        ),
        isIncluded: route ? route.includedObjectIds.includes(object.id) : false,
        isSelectedStart: object.id === selectedStartHoldObjectId,
      })),
    [
      analysisImage,
      objects,
      photo,
      route,
      selectedStartHoldObjectId,
      transform,
      viewportHeight,
      viewportWidth,
    ],
  );

  const accentColor = route?.routeColor.hex ?? "#ffb37a";

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg height="100%" width="100%">
        {mappedObjects.map((object) => {
          const points = object.viewportContour
            .map((point) => `${point.x},${point.y}`)
            .join(" ");
          const strokeColor = isRouteMode
            ? object.isIncluded
              ? accentColor
              : object.kind === "hold"
                ? "rgba(255,255,255,0.16)"
                : "rgba(149,216,255,0.18)"
            : "rgba(255,255,255,0.94)";
          const fillColor = isRouteMode
            ? object.isIncluded
              ? "rgba(255,140,56,0.08)"
              : object.kind === "hold"
                ? "rgba(255,255,255,0)"
                : "rgba(149,216,255,0)"
            : "rgba(255,255,255,0)";

          return (
            <G key={object.id}>
              <Polygon
                fill={fillColor}
                points={points}
                stroke="rgba(15,15,15,0.92)"
                strokeLinejoin="round"
                strokeWidth={isRouteMode ? (object.isIncluded ? 4.2 : 2.2) : 3.4}
              />
              <Polygon
                fill={fillColor}
                points={points}
                stroke={strokeColor}
                strokeLinejoin="round"
                strokeWidth={isRouteMode ? (object.isIncluded ? 1.8 : 0.7) : 1.2}
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
