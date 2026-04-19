import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createWallAnalysis,
  selectDetectedRoute,
} from "../lib/routeDetectionApi";
import { viewportPointToPhotoPoint } from "../lib/simulationViewport";
import type {
  RouteSelectionResult,
  SimulationDetectedObject,
  SimulationPhoto,
  SimulationPoint,
  SimulationPhotoTransform,
  WallAnalysisResult,
} from "../types/simulation";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { ConfirmModal } from "./ConfirmModal";
import { RouteHighlightOverlay } from "./RouteHighlightOverlay";
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
  const [analysisResult, setAnalysisResult] = useState<WallAnalysisResult | null>(null);
  const [routeResult, setRouteResult] = useState<RouteSelectionResult | null>(null);
  const [selectedStartHoldObjectId, setSelectedStartHoldObjectId] = useState<string | null>(
    null,
  );
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [isAnalyzingWall, setIsAnalyzingWall] = useState(false);
  const [isSelectingRoute, setIsSelectingRoute] = useState(false);

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  useEffect(() => {
    let isMounted = true;

    setAnalysisResult(null);
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setHighlightError(null);
    setIsAnalyzingWall(true);
    setIsSelectingRoute(false);

    void createWallAnalysis(photo)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setAnalysisResult(result);

        if (result.objects.length === 0) {
          setHighlightError("홀드와 볼륨을 찾지 못했어요. 다른 사진으로 다시 시도해보세요.");
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setHighlightError(
          error instanceof Error
            ? error.message
            : "벽 분석에 실패했어요. 서버 연결을 확인해보세요.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsAnalyzingWall(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [photo]);

  useEffect(() => {
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
  }, [transform]);

  function getDistanceSquared(a: SimulationPoint, b: SimulationPoint) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
  }

  function selectNearestHold(
    sourcePoint: SimulationPoint,
    objects: SimulationDetectedObject[],
  ) {
    const holds = objects.filter((object) => object.kind === "hold");

    if (holds.length === 0) {
      return null;
    }

    return holds.reduce((closest, current) =>
      getDistanceSquared(sourcePoint, current.center) <
      getDistanceSquared(sourcePoint, closest.center)
        ? current
        : closest,
    );
  }

  async function handleCanvasPress(point: SimulationPoint) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      isAnalyzingWall ||
      isSelectingRoute ||
      !analysisResult
    ) {
      return;
    }

    const sourceStartHoldPoint = viewportPointToPhotoPoint(
      point,
      photo,
      transform,
      viewport.width,
      viewport.height,
    );
    const startHoldObject = selectNearestHold(
      sourceStartHoldPoint,
      analysisResult.objects,
    );

    if (!startHoldObject) {
      setHighlightError("선택할 수 있는 홀드를 찾지 못했어요.");
      return;
    }

    setSelectedStartHoldObjectId(startHoldObject.id);
    setHighlightError(null);
    setIsSelectingRoute(true);

    try {
      const result = await selectDetectedRoute({
        analysisId: analysisResult.id,
        startHoldObjectId: startHoldObject.id,
      });

      setRouteResult(result);

      if (result.includedObjectIds.length === 0) {
        setHighlightError("같은 색 route를 찾지 못했어요. 다른 홀드를 탭해보세요.");
      }
    } catch {
      setRouteResult(null);
      setHighlightError("루트 선택에 실패했어요. 다시 탭해보세요.");
    } finally {
      setIsSelectingRoute(false);
    }
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

          {analysisResult && viewport.width > 0 && viewport.height > 0 ? (
            <RouteHighlightOverlay
              objects={analysisResult.objects}
              photo={photo}
              route={routeResult}
              selectedStartHoldObjectId={selectedStartHoldObjectId}
              transform={transform}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          <Pressable
            onPress={(event) =>
              void handleCanvasPress({
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
              })
            }
            style={styles.touchLayer}
          >
            <View style={styles.infoOverlay}>
              <View style={styles.infoCard}>
                <Text style={styles.infoEyebrow}>ROUTE DETECTION</Text>
                <Text style={styles.infoTitle}>
                  {isAnalyzingWall
                    ? "홀드와 볼륨을 분석하는 중"
                    : isSelectingRoute
                      ? "같은 색 route를 찾는 중"
                      : "스타트 홀드를 탭해 전체 루트를 강조하세요"}
                </Text>
                <Text style={styles.infoBody}>
                  {isAnalyzingWall
                    ? "사진을 서버로 보내 hold와 volume border를 먼저 찾고 있어요."
                    : isSelectingRoute
                      ? "선택한 스타트 홀드를 기준으로 같은 색 hold와 연결된 volume을 고르고 있어요."
                      : "분석이 끝난 뒤 홀드를 탭하면 같은 색 route를 자동으로 강조합니다. 다시 탭하면 다른 스타트 홀드로 재선택합니다."}
                </Text>

                {isAnalyzingWall || isSelectingRoute ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffb37a" size="small" />
                    <Text style={styles.loadingText}>
                      {isAnalyzingWall
                        ? "wall analysis 요청 중"
                        : "route selection 요청 중"}
                    </Text>
                  </View>
                ) : null}

                {!isAnalyzingWall && analysisResult ? (
                  <View style={styles.resultRow}>
                    <View style={styles.resultChip}>
                      <View
                        style={[
                          styles.resultColorDot,
                          {
                            backgroundColor: routeResult?.routeColor.hex ?? "#ffffff",
                          },
                        ]}
                      />
                      <Text style={styles.resultChipText}>
                        {routeResult ? "선택 route" : "분석 완료"}
                      </Text>
                    </View>

                    <Text style={styles.resultCount}>
                      {routeResult
                        ? `${routeResult.includedObjectIds.length}개 오브젝트 강조`
                        : `${analysisResult.objects.length}개 오브젝트 감지`}
                    </Text>
                  </View>
                ) : null}

                {highlightError ? (
                  <Text style={styles.errorText}>{highlightError}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>

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
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  infoOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
  },
  infoCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderRadius: 24,
    backgroundColor: "rgba(10, 10, 10, 0.74)",
  },
  infoEyebrow: {
    color: "#ffb37a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  infoTitle: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  infoBody: {
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffddb7",
    fontSize: 13,
    fontWeight: "700",
  },
  resultRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultColorDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  resultChipText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  resultCount: {
    color: "#ffddb7",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#ff9b8d",
    fontSize: 13,
    lineHeight: 18,
  },
  overlayIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 15, 15, 0.68)",
  },
});
