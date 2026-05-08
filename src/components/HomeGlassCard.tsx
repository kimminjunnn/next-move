import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

export function HomeGlassCard() {
  return (
    <View style={styles.shell}>
      <BlurView intensity={58} style={styles.blurLayer} tint="light">
        <View pointerEvents="none" style={styles.softFill} />
        <View pointerEvents="none" style={styles.topShine} />
        <View pointerEvents="none" style={styles.innerGlow} />

        <View style={styles.content}>
          <Text style={styles.brand}>{brand.name}</Text>
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
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "rgba(243, 229, 191, 0.14)",
    shadowColor: brand.colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 7,
  },
  blurLayer: {
    minHeight: 500,
    paddingHorizontal: 32,
    paddingTop: 44,
    paddingBottom: 42,
  },
  softFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 244, 215, 0.42)",
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
    inset: 18,
    borderRadius: 26,
    backgroundColor: "rgba(224, 180, 40, 0.06)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  brand: {
    color: brand.colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 7,
    textAlign: "center",
  },
  eyebrow: {
    color: brand.colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 5,
    textAlign: "center",
  },
  title: {
    color: brand.colors.text,
    fontSize: 37,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: -1.3,
    textAlign: "center",
  },
  description: {
    color: brand.colors.mutedText,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "500",
    textAlign: "center",
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(37, 29, 21, 0.16)",
  },
});
