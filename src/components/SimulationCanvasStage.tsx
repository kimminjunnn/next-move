import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { ConfirmModal } from "./ConfirmModal";
import { SimulationPhotoViewport } from "./SimulationPhotoViewport";

type SimulationCanvasStageProps = {
  photo: SimulationPhoto;
  transform: SimulationPhotoTransform;
  onClearPhoto: () => void;
  onOpenCamera: () => void;
  onOpenLibrary: () => void;
};

export function SimulationCanvasStage({
  photo,
  transform,
  onClearPhoto,
  onOpenCamera,
  onOpenLibrary,
}: SimulationCanvasStageProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppHeader showDivider={false} title="Next Move" />

        <View onLayout={handleViewportLayout} style={styles.canvasArea}>
          {viewport.width > 0 && viewport.height > 0 ? (
            <SimulationPhotoViewport
              photo={photo}
              transform={transform}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          <View style={styles.canvasTopOverlay}>
            <Pressable onPress={onOpenCamera} style={styles.overlayIconButton}>
              <Ionicons color="#ffffff" name="camera-outline" size={20} />
            </Pressable>

            <Pressable onPress={onOpenLibrary} style={styles.overlayIconButton}>
              <Ionicons color="#ffffff" name="images-outline" size={20} />
            </Pressable>

            <Pressable
              onPress={() => setConfirmVisible(true)}
              style={styles.overlayIconButton}
            >
              <Ionicons color="#ffffff" name="trash-outline" size={20} />
            </Pressable>
          </View>
        </View>

        <BottomTabBar active="simulation" />

        <ConfirmModal
          body="현재 시뮬레이션에 올린 사진이 초기화됩니다."
          confirmLabel="삭제"
          onCancel={() => setConfirmVisible(false)}
          onConfirm={() => {
            setConfirmVisible(false);
            onClearPhoto();
          }}
          onRequestClose={() => setConfirmVisible(false)}
          title="사진을 삭제할까요?"
          visible={confirmVisible}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f3eb",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f8f3eb",
  },
  canvasArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
  },
  canvasTopOverlay: {
    position: "absolute",
    top: 14,
    right: 16,
    flexDirection: "row",
    gap: 10,
  },
  overlayIconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 15, 15, 0.62)",
  },
});
