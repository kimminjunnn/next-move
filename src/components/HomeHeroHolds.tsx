import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from "react-native";

const blueOrb = require("../assets/home/hold-orb-blue.png");
const yellowPillar = require("../assets/home/hold-pillar-yellow.png");
const greenChip = require("../assets/home/hold-chip-green.png");
const pinkDisc = require("../assets/home/hold-disc-pink.png");
const orangeBlob = require("../assets/home/hold-blob-orange.png");

function HoldImage({
  source,
  style,
}: {
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      fadeDuration={0}
      resizeMode="contain"
      source={source}
      style={style}
    />
  );
}

export function HomeHeroHolds() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.ambientGlow, styles.glowTop]} />
      <View style={[styles.ambientGlow, styles.glowBottom]} />

      <HoldImage source={blueOrb} style={styles.holdOrb} />
      <HoldImage source={yellowPillar} style={styles.holdPillar} />
      <HoldImage source={greenChip} style={styles.holdChip} />
      <HoldImage source={pinkDisc} style={styles.holdDisc} />
      <HoldImage source={orangeBlob} style={styles.holdBlob} />
    </View>
  );
}

const styles = StyleSheet.create({
  ambientGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.40)",
    shadowColor: "#f8edd7",
    shadowOpacity: 0.66,
    shadowRadius: 56,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  glowTop: {
    top: 44,
    left: "28%",
    width: 180,
    height: 180,
  },
  glowBottom: {
    bottom: 188,
    right: "18%",
    width: 150,
    height: 150,
  },
  holdOrb: {
    position: "absolute",
    top: 76,
    left: -138,
    width: 372,
    height: 372,
    transform: [{ rotate: "-6deg" }],
  },
  holdPillar: {
    position: "absolute",
    top: 210,
    right: -48,
    width: 206,
    height: 248,
    transform: [{ rotate: "4deg" }],
  },
  holdChip: {
    position: "absolute",
    top: 592,
    left: 42,
    width: 108,
    height: 108,
    transform: [{ rotate: "-20deg" }],
  },
  holdDisc: {
    position: "absolute",
    top: 716,
    right: 28,
    width: 166,
    height: 166,
  },
  holdBlob: {
    position: "absolute",
    bottom: 166,
    left: 24,
    width: 268,
    height: 268,
    transform: [{ rotate: "3deg" }],
  },
});
