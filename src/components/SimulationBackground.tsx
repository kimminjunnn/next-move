import { StyleSheet, View } from "react-native";

import { brand } from "../theme/brand";
import { ClimbingWallTexture } from "./ClimbingWallTexture";

export function SimulationBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <ClimbingWallTexture />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brand.colors.wall,
  },
});
