import { Image, StyleSheet, View } from "react-native";

const gymWallBackground = require("../../assets/rupa_theme/gym-wall-bg-bright.png");

export function HomeHeroHolds() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        fadeDuration={0}
        resizeMode="cover"
        source={gymWallBackground}
        style={styles.background}
      />
      <View style={styles.readabilityOverlay} />
      <View style={styles.warmCenterGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  readabilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(37, 29, 21, 0.02)",
  },
  warmCenterGlow: {
    position: "absolute",
    top: "22%",
    left: "8%",
    right: "8%",
    height: "40%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 244, 215, 0.1)",
  },
});
