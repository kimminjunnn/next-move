import { Image, StyleSheet, View } from "react-native";

import {
  getBaseDimensions,
  resolveAbsoluteOffsets,
} from "../lib/simulationViewport";
import type {
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

type SimulationPhotoViewportProps = {
  photo: SimulationPhoto;
  transform: SimulationPhotoTransform;
  viewportHeight: number;
  viewportWidth: number;
};

export function SimulationPhotoViewport({
  photo,
  transform,
  viewportHeight,
  viewportWidth,
}: SimulationPhotoViewportProps) {
  const baseDimensions = getBaseDimensions(photo, viewportWidth, viewportHeight);
  const absoluteOffsets = resolveAbsoluteOffsets(
    transform,
    baseDimensions.width,
    baseDimensions.height,
    viewportWidth,
    viewportHeight,
  );

  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.photoLayer,
          {
            width: baseDimensions.width * transform.scale,
            height: baseDimensions.height * transform.scale,
            transform: [
              { translateX: absoluteOffsets.translateX },
              { translateY: absoluteOffsets.translateY },
            ],
          },
        ]}
      >
        <Image
          resizeMode="cover"
          source={{ uri: photo.uri }}
          style={styles.photo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
  },
  photoLayer: {
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
