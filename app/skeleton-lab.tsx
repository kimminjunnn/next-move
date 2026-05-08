import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SkeletonPoseOverlay,
  type SkeletonPoseOverlayHandle,
  type SkeletonPoseOverlayHistoryState,
} from "../src/components/SkeletonPoseOverlay";
import { brand } from "../src/theme/brand";

type SkeletonLabMode = "calibrating" | "simulating";

const HOLD_POINTS = [
  { id: "hold-1", x: "19%", y: "24%", size: 38, color: "#42a9ff" },
  { id: "hold-2", x: "72%", y: "20%", size: 44, color: "#f05f7a" },
  { id: "hold-3", x: "51%", y: "38%", size: 32, color: "#f1b843" },
  { id: "hold-4", x: "22%", y: "57%", size: 46, color: "#55bd7d" },
  { id: "hold-5", x: "76%", y: "61%", size: 36, color: "#9c70ff" },
  { id: "hold-6", x: "44%", y: "78%", size: 42, color: "#e85d3f" },
] as const;

export default function SkeletonLabScreen() {
  const router = useRouter();
  const skeletonOverlayRef = useRef<SkeletonPoseOverlayHandle>(null);
  const [mode, setMode] = useState<SkeletonLabMode>("simulating");
  const [historyState, setHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });
  const [resetKey, setResetKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setViewport({ width, height });
  }

  const hasViewport = viewport.width > 0 && viewport.height > 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로 가기"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons color="#241810" name="chevron-back" size={22} />
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={styles.eyebrow}>TEMP LAB</Text>
            <Text style={styles.title}>스켈레톤 무빙 테스트</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="스켈레톤 이동 실행 취소"
              disabled={!historyState.canUndo}
              onPress={() => skeletonOverlayRef.current?.undo()}
              style={[
                styles.iconButton,
                !historyState.canUndo ? styles.iconButtonDisabled : null,
              ]}
            >
              <Ionicons color="#241810" name="arrow-undo" size={19} />
            </Pressable>

            <Pressable
              accessibilityLabel="스켈레톤 이동 다시 실행"
              disabled={!historyState.canRedo}
              onPress={() => skeletonOverlayRef.current?.redo()}
              style={[
                styles.iconButton,
                !historyState.canRedo ? styles.iconButtonDisabled : null,
              ]}
            >
              <Ionicons color="#241810" name="arrow-redo" size={19} />
            </Pressable>

            <Pressable
              accessibilityLabel="스켈레톤 리셋"
              onPress={() => setResetKey((current) => current + 1)}
              style={styles.iconButton}
            >
              <Ionicons color="#241810" name="refresh" size={20} />
            </Pressable>
          </View>
        </View>

        <View style={styles.toolbar}>
          <Pressable
            onPress={() => setMode("simulating")}
            style={[
              styles.segmentButton,
              mode === "simulating" ? styles.segmentButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "simulating" ? styles.segmentTextActive : null,
              ]}
            >
              무빙
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("calibrating")}
            style={[
              styles.segmentButton,
              mode === "calibrating" ? styles.segmentButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "calibrating" ? styles.segmentTextActive : null,
              ]}
            >
              크기 조정
            </Text>
          </Pressable>
        </View>

        <View onLayout={handleViewportLayout} style={styles.stage}>
          <View pointerEvents="none" style={styles.wallGrid}>
            {HOLD_POINTS.map((hold) => (
              <View
                key={hold.id}
                style={[
                  styles.hold,
                  {
                    backgroundColor: hold.color,
                    borderRadius: hold.size / 2,
                    height: hold.size,
                    left: hold.x,
                    top: hold.y,
                    width: hold.size,
                  },
                ]}
              />
            ))}
          </View>

          {hasViewport ? (
            <SkeletonPoseOverlay
              key={`${mode}-${resetKey}`}
              ref={skeletonOverlayRef}
              initialCenter={{
                x: viewport.width * 0.5,
                y: viewport.height * 0.48,
              }}
              mode={mode}
              onHistoryStateChange={setHistoryState}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f3eb",
  },
  screen: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: "#f7f3eb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(36,24,16,0.1)",
  },
  titleGroup: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButtonDisabled: {
    opacity: 0.34,
  },
  eyebrow: {
    color: brand.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
  },
  title: {
    color: "#241810",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  toolbar: {
    flexDirection: "row",
    alignSelf: "stretch",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(36,24,16,0.08)",
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 14,
  },
  segmentButtonActive: {
    backgroundColor: "#241810",
  },
  segmentText: {
    color: "rgba(36,24,16,0.62)",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
  },
  segmentTextActive: {
    color: "#fffdf8",
  },
  stage: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#2d2f31",
    borderWidth: 1,
    borderColor: "rgba(36,24,16,0.16)",
  },
  wallGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#35383a",
  },
  hold: {
    position: "absolute",
    marginLeft: -18,
    marginTop: -18,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },
});
