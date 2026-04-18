import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";

export function HomeGlassCard() {
  return (
    <View style={styles.shell}>
      <BlurView
        intensity={58}
        style={styles.blurLayer}
        tint="light"
      >
        <View pointerEvents="none" style={styles.softFill} />
        <View pointerEvents="none" style={styles.topShine} />
        <View pointerEvents="none" style={styles.innerGlow} />

        <View style={styles.content}>
          <Text style={styles.brand}>NEXT MOVE</Text>
          <Text style={styles.eyebrow}>볼더링 시뮬레이터</Text>
          <Text style={styles.title}>
            막힌 구간을{"\n"}직접 풀어보세요
          </Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#cabda8",
    shadowOpacity: 0.16,
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
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  topShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  innerGlow: {
    position: "absolute",
    inset: 18,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  brand: {
    color: "#1a1a1a",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 7,
    textAlign: "center",
  },
  eyebrow: {
    color: "#7d7d7d",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 5,
    textAlign: "center",
  },
  title: {
    color: "#111111",
    fontSize: 37,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: -1.3,
    textAlign: "center",
  },
  description: {
    color: "#333333",
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "500",
    textAlign: "center",
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.58)",
  },
});
