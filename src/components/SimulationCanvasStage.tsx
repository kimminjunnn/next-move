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
import { viewportPointToAnalysisPoint } from "../lib/simulationViewport";
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
import { SkeletonPoseOverlay } from "./SkeletonPoseOverlay";
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
  const [analysisResult, setAnalysisResult] =
    useState<WallAnalysisResult | null>(null);
  const [routeResult, setRouteResult] = useState<RouteSelectionResult | null>(
    null,
  );
  const [selectedStartHoldObjectId, setSelectedStartHoldObjectId] = useState<
    string | null
  >(null);
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
          setHighlightError(
            "홀드와 볼륨을 찾지 못했어요. 다른 사진으로 다시 시도해보세요.",
          );
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

  function getDistanceSquared(a: SimulationPoint, b: SimulationPoint) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
  }

  function isPointInPolygon(
    point: SimulationPoint,
    polygon: SimulationDetectedObject["contour"],
  ) {
    let isInside = false;

    for (
      let currentIndex = 0, previousIndex = polygon.length - 1;
      currentIndex < polygon.length;
      previousIndex = currentIndex, currentIndex += 1
    ) {
      const currentPoint = polygon[currentIndex];
      const previousPoint = polygon[previousIndex];
      const intersects =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y) +
            currentPoint.x;

      if (intersects) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  function selectNearestHold(
    sourcePoint: SimulationPoint,
    objects: SimulationDetectedObject[],
  ) {
    const holds = objects.filter((object) => object.kind === "hold");

    if (holds.length === 0) {
      return null;
    }

    const containingHold = holds.find((object) =>
      isPointInPolygon(sourcePoint, object.contour),
    );

    if (containingHold) {
      return containingHold;
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

    const analysisStartHoldPoint = viewportPointToAnalysisPoint(
      point,
      photo,
      analysisResult.image,
      transform,
      viewport.width,
      viewport.height,
    );
    const startHoldObject = selectNearestHold(
      analysisStartHoldPoint,
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
        setHighlightError(
          "같은 색 route를 찾지 못했어요. 다른 홀드를 탭해보세요.",
        );
      }
    } catch {
      setRouteResult(null);
      setHighlightError("루트 선택에 실패했어요. 다시 탭해보세요.");
    } finally {
      setIsSelectingRoute(false);
    }
  }

  const holdCount = analysisResult
    ? analysisResult.objects.filter((object) => object.kind === "hold").length
    : 0;
  const overlayObjects =
    analysisResult && routeResult === null
      ? analysisResult.objects.filter((object) => object.kind === "hold")
      : analysisResult?.objects ?? [];
  const overlayDisplayMode = routeResult ? "route" : "all-holds";
  const shouldShowSkeletonOverlay =
    !isAnalyzingWall && analysisResult !== null && holdCount > 0;

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
              analysisImage={analysisResult.image}
              displayMode={overlayDisplayMode}
              objects={overlayObjects}
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
                <View style={styles.infoHeaderRow}>
                  <Text style={styles.infoEyebrow}>ROUTE DETECTION</Text>
                  {!isAnalyzingWall && analysisResult ? (
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>
                        {routeResult
                          ? `${routeResult.includedObjectIds.length} selected`
                          : `${holdCount} holds`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.infoTitle}>
                  {isAnalyzingWall
                    ? "홀드 border를 찾는 중"
                    : isSelectingRoute
                      ? "같은 색 route를 찾는 중"
                      : routeResult
                        ? "다른 스타트 홀드를 탭해 다시 선택"
                        : "모든 홀드를 표시했어요. 스타트 홀드를 탭하세요"}
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

                {highlightError ? (
                  <Text style={styles.errorText}>{highlightError}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>

          {shouldShowSkeletonOverlay &&
          viewport.width > 0 &&
          viewport.height > 0 ? (
            <SkeletonPoseOverlay
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
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  infoOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  },
  infoCard: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(10, 10, 10, 0.58)",
  },
  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoEyebrow: {
    color: "#ffb37a",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  infoTitle: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  statusChipText: {
    color: "#ffddb7",
    fontSize: 11,
    fontWeight: "700",
  },
  loadingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#ffddb7",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 8,
    color: "#ff9b8d",
    fontSize: 12,
    lineHeight: 16,
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
