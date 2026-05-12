import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ImageBackground,
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
import {
  RUPA_BACK_CHARACTER_VARIANTS,
  getRupaCharacterVariant,
  type RupaCharacterVariantId,
} from "../src/lib/rupaCharacterRig";
import { brand } from "../src/theme/brand";

type SkeletonLabRenderSelection =
  | RupaCharacterVariantId
  | "minimalSkeleton"
  | "stickmanCharacter"
  | "stickmanCharacterNavy"
  | "stickmanCharacterBlack";

export default function SkeletonLabScreen() {
  const router = useRouter();
  const skeletonOverlayRef = useRef<SkeletonPoseOverlayHandle>(null);
  const [renderSelection, setRenderSelection] =
    useState<SkeletonLabRenderSelection>("stickmanCharacter");
  const [historyState, setHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });
  const [resetKey, setResetKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const characterVariant = useMemo(
    () =>
      getRupaCharacterVariant(
        renderSelection === "minimalSkeleton" ||
          renderSelection === "stickmanCharacter" ||
          renderSelection === "stickmanCharacterNavy" ||
          renderSelection === "stickmanCharacterBlack"
          ? "illustrated"
          : renderSelection,
      ),
    [renderSelection],
  );

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

        <View style={styles.variantToolbar}>
          {RUPA_BACK_CHARACTER_VARIANTS.map((variant) => {
            const isActive = variant.id === renderSelection;

            return (
              <Pressable
                accessibilityLabel={`루파 캐릭터 ${variant.label} 버전`}
                key={variant.id}
                onPress={() => setRenderSelection(variant.id)}
                style={[
                  styles.variantButton,
                  isActive ? styles.variantButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.variantText,
                    isActive ? styles.variantTextActive : null,
                  ]}
                >
                  {variant.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityLabel="스틱맨 캐릭터 렌더러"
            onPress={() => setRenderSelection("stickmanCharacter")}
            style={[
              styles.variantButton,
              renderSelection === "stickmanCharacter"
                ? styles.variantButtonActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.variantText,
                renderSelection === "stickmanCharacter"
                  ? styles.variantTextActive
                  : null,
              ]}
            >
              스틱맨
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="네이비 스틱맨 캐릭터 렌더러"
            onPress={() => setRenderSelection("stickmanCharacterNavy")}
            style={[
              styles.variantButton,
              renderSelection === "stickmanCharacterNavy"
                ? styles.variantButtonActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.variantText,
                renderSelection === "stickmanCharacterNavy"
                  ? styles.variantTextActive
                  : null,
              ]}
            >
              네이비
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="검정 스틱맨 캐릭터 렌더러"
            onPress={() => setRenderSelection("stickmanCharacterBlack")}
            style={[
              styles.variantButton,
              renderSelection === "stickmanCharacterBlack"
                ? styles.variantButtonActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.variantText,
                renderSelection === "stickmanCharacterBlack"
                  ? styles.variantTextActive
                  : null,
              ]}
            >
              검정
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="미니멀 스켈레톤 렌더러"
            onPress={() => setRenderSelection("minimalSkeleton")}
            style={[
              styles.variantButton,
              renderSelection === "minimalSkeleton"
                ? styles.variantButtonActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.variantText,
                renderSelection === "minimalSkeleton"
                  ? styles.variantTextActive
                  : null,
              ]}
            >
              미니멀
            </Text>
          </Pressable>
        </View>

        <View onLayout={handleViewportLayout} style={styles.stage}>
          <View pointerEvents="none" style={styles.wallPhoto}>
            <ImageBackground
              resizeMode="cover"
              source={require("../assets/rupa_theme/backgrounds/IMG_3392.png")}
              style={styles.wallPhoto}
            />
          </View>

          {hasViewport ? (
            <SkeletonPoseOverlay
              key={resetKey}
              ref={skeletonOverlayRef}
              allowEmptySpacePinchScale
              allowPinchScaleInSimulation
              characterParts={characterVariant.parts}
              characterRenderStyle={
                renderSelection === "minimalSkeleton" ||
                renderSelection === "stickmanCharacter" ||
                renderSelection === "stickmanCharacterNavy" ||
                renderSelection === "stickmanCharacterBlack"
                  ? renderSelection
                  : "rupaRig"
              }
              initialCenter={{
                x: viewport.width * 0.5,
                y: viewport.height * 0.48,
              }}
              mode="simulating"
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
  variantToolbar: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 8,
  },
  variantButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(36,24,16,0.1)",
  },
  variantButtonActive: {
    backgroundColor: "#0f7f7c",
    borderColor: "rgba(15,127,124,0.42)",
  },
  variantText: {
    color: "rgba(36,24,16,0.7)",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  variantTextActive: {
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
  wallPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
});
