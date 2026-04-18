import { Image, StyleSheet, View } from "react-native";

const blueOrb = require("../assets/home/hold-orb-blue.png");
const yellowPillar = require("../assets/home/hold-pillar-yellow.png");
const pinkDisc = require("../assets/home/hold-disc-pink.png");
const orangeBlob = require("../assets/home/hold-blob-orange.png");

export function SimulationBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.ambientGlow, styles.glowTop]} />
      <View style={[styles.ambientGlow, styles.glowBottom]} />

      <Image fadeDuration={0} resizeMode="contain" source={blueOrb} style={styles.blueOrb} />
      <Image
        fadeDuration={0}
        resizeMode="contain"
        source={yellowPillar}
        style={styles.yellowPillar}
      />
      <Image fadeDuration={0} resizeMode="contain" source={orangeBlob} style={styles.orangeBlob} />
      <Image fadeDuration={0} resizeMode="contain" source={pinkDisc} style={styles.pinkDisc} />
    </View>
  );
}

const styles = StyleSheet.create({
  ambientGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.36)",
    shadowColor: "#f8edd7",
    shadowOpacity: 0.58,
    shadowRadius: 46,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  glowTop: {
    top: 88,
    left: "24%",
    width: 170,
    height: 170,
  },
  glowBottom: {
    bottom: 180,
    right: "16%",
    width: 136,
    height: 136,
  },
  blueOrb: {
    position: "absolute",
    top: 108,
    left: -132,
    width: 286,
    height: 286,
    opacity: 0.88,
    transform: [{ rotate: "-8deg" }],
  },
  yellowPillar: {
    position: "absolute",
    top: 192,
    right: -42,
    width: 158,
    height: 188,
    opacity: 0.76,
    transform: [{ rotate: "4deg" }],
  },
  orangeBlob: {
    position: "absolute",
    bottom: 122,
    left: -22,
    width: 214,
    height: 214,
    opacity: 0.74,
    transform: [{ rotate: "4deg" }],
  },
  pinkDisc: {
    position: "absolute",
    bottom: 90,
    right: -12,
    width: 132,
    height: 132,
    opacity: 0.7,
  },
});
