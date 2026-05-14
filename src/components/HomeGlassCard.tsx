import { BlurView } from "expo-blur";
import { Image, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

const rupaLogo = require("../../assets/rupa-logo.png");

export function HomeGlassCard() {
  return (
    <View style={styles.shell}>
      <BlurView intensity={58} style={styles.blurLayer} tint="light">
        <View pointerEvents="none" style={styles.softFill} />
        <View pointerEvents="none" style={styles.topShine} />
        <View pointerEvents="none" style={styles.innerGlow} />

        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={rupaLogo}
            style={styles.logoImage}
          />
          <Text style={styles.eyebrow}>볼더링 시뮬레이터</Text>
          <Text style={styles.title}>막힌 구간을{"\n"}직접 풀어보세요</Text>
          <Text style={styles.description}>
            벽 사진을 넣고 움직임을 바로 맞춰보세요.
          </Text>
        </View>
      </BlurView>

      <View pointerEvents="none" style={styles.borderOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "stretch",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255, 244, 215, 0.18)",
    shadowColor: brand.colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 7,
  },
  blurLayer: {
    minHeight: 430,
    paddingHorizontal: 30,
    paddingTop: 34,
    paddingBottom: 36,
  },
  softFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 244, 215, 0.36)",
  },
  topShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 253, 248, 0.72)",
  },
  innerGlow: {
    position: "absolute",
    inset: 16,
    borderRadius: 24,
    backgroundColor: "rgba(254, 214, 96, 0.08)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 17,
  },
  logoImage: {
    width: 178,
    height: 74,
  },
  eyebrow: {
    color: brand.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3.2,
    textAlign: "center",
  },
  title: {
    color: brand.colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: 0,
    textAlign: "center",
  },
  description: {
    color: brand.colors.mutedText,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "500",
    textAlign: "center",
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(37, 29, 21, 0.14)",
  },
});
