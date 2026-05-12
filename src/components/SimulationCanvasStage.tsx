import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import {
  analysisPointToViewportPoint,
  viewportPointToAnalysisPoint,
} from "../lib/simulationViewport";
import { toggleRouteIncludedObjectIds } from "../lib/routeSelectionState";
import {
  shouldShowWallAnalysisFallbackStart,
  shouldShowWallAnalysisRetry,
} from "../lib/wallAnalysisRetry";
import type { Point2D } from "../types/geometry";
import type {
  RouteSelectionResult,
  SimulationDetectedObject,
  SimulationPhoto,
  SimulationPhotoTransform,
  WallAnalysisResult,
} from "../types/simulation";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { ConfirmModal } from "./ConfirmModal";
import { brand } from "../theme/brand";
import { RouteHighlightOverlay } from "./RouteHighlightOverlay";
import {
  SkeletonPoseOverlay,
  type SkeletonPoseOverlayHandle,
  type SkeletonPoseOverlayHistoryState,
} from "./SkeletonPoseOverlay";
import { SimulationPhotoViewport } from "./SimulationPhotoViewport";

type SimulationCanvasStageProps = {
  photo: SimulationPhoto;
  transform: SimulationPhotoTransform;
  onClearPhoto: () => void;
  onOpenCamera: () => void;
  onOpenLibrary: () => void;
};

type CanvasFlowStep =
  | "analyzingHolds"
  | "selectingStartHold"
  | "selectingRoute"
  | "routeEditing"
  | "sizingSkeleton"
  | "simulating";

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
  const [flowStep, setFlowStep] = useState<CanvasFlowStep>("analyzingHolds");
  const [analysisAttempt, setAnalysisAttempt] = useState(0);
  const simulationCueOpacity = useRef(new Animated.Value(0)).current;
  const simulationCueTranslateY = useRef(new Animated.Value(18)).current;
  const simulationCueScale = useRef(new Animated.Value(0.92)).current;
  const skeletonOverlayRef = useRef<SkeletonPoseOverlayHandle>(null);
  const [skeletonHistoryState, setSkeletonHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });

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
    setFlowStep("analyzingHolds");

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
          setFlowStep("selectingStartHold");
          return;
        }

        setFlowStep("selectingStartHold");
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
        setFlowStep("selectingStartHold");
      });

    return () => {
      isMounted = false;
    };
  }, [analysisAttempt, photo]);

  useEffect(() => {
    simulationCueOpacity.stopAnimation();
    simulationCueTranslateY.stopAnimation();
    simulationCueScale.stopAnimation();

    if (flowStep !== "simulating") {
      simulationCueOpacity.setValue(0);
      simulationCueTranslateY.setValue(18);
      simulationCueScale.setValue(0.92);
      return;
    }

    simulationCueOpacity.setValue(0);
    simulationCueTranslateY.setValue(18);
    simulationCueScale.setValue(0.92);

    const cueAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(simulationCueOpacity, {
          duration: 160,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueTranslateY, {
          duration: 160,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueScale, {
          duration: 160,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(760),
      Animated.parallel([
        Animated.timing(simulationCueOpacity, {
          duration: 520,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueTranslateY, {
          duration: 520,
          toValue: -18,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueScale, {
          duration: 520,
          toValue: 1.28,
          useNativeDriver: true,
        }),
      ]),
    ]);
    cueAnimation.start();

    return () => {
      cueAnimation.stop();
    };
  }, [
    flowStep,
    simulationCueOpacity,
    simulationCueScale,
    simulationCueTranslateY,
  ]);

  function getDistanceSquared(a: Point2D, b: Point2D) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
  }

  function isPointInPolygon(
    point: Point2D,
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
    sourcePoint: Point2D,
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

  function findContainingHold(
    sourcePoint: Point2D,
    objects: SimulationDetectedObject[],
  ) {
    return (
      objects.find(
        (object) =>
          object.kind === "hold" &&
          isPointInPolygon(sourcePoint, object.contour),
      ) ?? null
    );
  }

  async function handleCanvasPress(point: Point2D) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      flowStep !== "selectingStartHold" ||
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
    setRouteResult(null);
    setFlowStep("selectingRoute");

    try {
      const result = await selectDetectedRoute({
        analysisId: analysisResult.id,
        startHoldObjectId: startHoldObject.id,
      });

      if (result.includedObjectIds.length === 0) {
        setRouteResult(null);
        setHighlightError(
          "같은 색 루트를 찾지 못했어요. 다른 홀드를 탭해보세요.",
        );
        setFlowStep("selectingStartHold");
        return;
      }

      setRouteResult(result);
      setFlowStep("routeEditing");
    } catch {
      setRouteResult(null);
      setHighlightError("루트 선택에 실패했어요. 다시 탭해보세요.");
      setFlowStep("selectingStartHold");
    }
  }

  function handleRouteHoldToggle(point: Point2D) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      !analysisResult ||
      !routeResult
    ) {
      return;
    }

    const analysisPoint = viewportPointToAnalysisPoint(
      point,
      photo,
      analysisResult.image,
      transform,
      viewport.width,
      viewport.height,
    );
    const holdObject = findContainingHold(
      analysisPoint,
      analysisResult.objects,
    );

    if (!holdObject) {
      return;
    }

    setRouteResult((currentRoute) => {
      if (!currentRoute) {
        return currentRoute;
      }

      return {
        ...currentRoute,
        includedObjectIds: toggleRouteIncludedObjectIds({
          includedObjectIds: currentRoute.includedObjectIds,
          objectId: holdObject.id,
          startHoldObjectId: currentRoute.startHoldObjectId,
        }),
      };
    });
  }

  function handleReselectRoute() {
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setHighlightError(null);
    setFlowStep("selectingStartHold");
  }

  function handleRetryAnalysis() {
    setAnalysisAttempt((currentAttempt) => currentAttempt + 1);
  }

  function handleStartWithoutAnalysis() {
    setAnalysisResult(null);
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setHighlightError(null);
    setFlowStep("sizingSkeleton");
  }

  const holdCount = analysisResult
    ? analysisResult.objects.filter((object) => object.kind === "hold").length
    : 0;
  const overlayObjects =
    analysisResult && routeResult && flowStep !== "routeEditing"
      ? analysisResult.objects.filter((object) =>
          routeResult.includedObjectIds.includes(object.id),
        )
      : analysisResult
        ? analysisResult.objects.filter((object) => object.kind === "hold")
        : [];
  const overlayDisplayMode = routeResult ? "route" : "all-holds";
  const selectedStartHoldObject =
    analysisResult && selectedStartHoldObjectId
      ? analysisResult.objects.find(
          (object) => object.id === selectedStartHoldObjectId,
        )
      : null;
  const selectedStartHoldViewportCenter =
    analysisResult && selectedStartHoldObject
      ? analysisPointToViewportPoint(
          selectedStartHoldObject.center,
          analysisResult.image,
          photo,
          transform,
          viewport.width,
          viewport.height,
        )
      : null;
  const skeletonInitialCenter =
    selectedStartHoldViewportCenter && viewport.width > 0 && viewport.height > 0
      ? {
          x: Math.min(
            Math.max(selectedStartHoldViewportCenter.x, 36),
            viewport.width - 36,
          ),
          y: Math.min(
            Math.max(
              selectedStartHoldViewportCenter.y + viewport.height * 0.16,
              90,
            ),
            viewport.height - 150,
          ),
        }
      : undefined;
  const isAnalyzingHolds = flowStep === "analyzingHolds";
  const isSelectingRoute = flowStep === "selectingRoute";
  const shouldShowSkeletonOverlay =
    flowStep === "sizingSkeleton" || flowStep === "simulating";
  const shouldShowInfoCard = flowStep !== "simulating";
  const shouldShowRetryButton = shouldShowWallAnalysisRetry({
    analysisResult,
    flowStep,
    highlightError,
  });
  const shouldShowFallbackStartButton = shouldShowWallAnalysisFallbackStart({
    analysisResult,
    flowStep,
    highlightError,
  });

  const infoTitle = (() => {
    switch (flowStep) {
      case "analyzingHolds":
        return "홀드 테두리를 찾는 중";
      case "selectingStartHold":
        if (!analysisResult) {
          return "분석 결과를 불러오지 못했어요";
        }
        if (holdCount === 0) {
          return "인식된 홀드가 없어요";
        }
        return "스타트 홀드를 탭하세요";
      case "selectingRoute":
        return "같은 색 루트를 찾는 중";
      case "routeEditing":
        return "루트 홀드를 확인하세요";
      case "sizingSkeleton":
        return "스켈레톤 크기와 위치를 맞춰주세요";
      case "simulating":
        return "손과 발을 움직여 다음 동작을 확인하세요";
    }
  })();

  const loadingText = isAnalyzingHolds
    ? "벽 사진을 분석하고 있어요"
    : "같은 색 홀드를 묶고 있어요";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppHeader showDivider={false} title={brand.name} />

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

          {routeResult && flowStep === "routeEditing" ? (
            <Pressable
              onPress={(event) =>
                handleRouteHoldToggle({
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                })
              }
              style={styles.touchLayer}
            />
          ) : null}

          {flowStep === "selectingStartHold" ||
          flowStep === "selectingRoute" ||
          flowStep === "analyzingHolds" ? (
            <Pressable
              onPress={(event) =>
                void handleCanvasPress({
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                })
              }
              style={styles.touchLayer}
            >
              {shouldShowInfoCard ? (
                <View style={styles.infoOverlay}>
                  <View style={styles.infoCard}>
                    <View style={styles.infoHeaderRow}>
                      <Text style={styles.infoEyebrow}>ROUTE DETECTION</Text>
                      {!isAnalyzingHolds && analysisResult ? (
                        <View style={styles.statusChip}>
                          <Text style={styles.statusChipText}>
                            {routeResult
                              ? `${routeResult.includedObjectIds.length} route`
                              : `${holdCount} holds`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.infoTitle}>{infoTitle}</Text>

                    {isAnalyzingHolds || isSelectingRoute ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator
                          color={brand.colors.primary}
                          size="small"
                        />
                        <Text style={styles.loadingText}>{loadingText}</Text>
                      </View>
                    ) : null}

                    {highlightError ? (
                      <Text style={styles.errorText}>{highlightError}</Text>
                    ) : null}

                    {shouldShowFallbackStartButton || shouldShowRetryButton ? (
                      <View style={styles.analysisFailureActions}>
                        {shouldShowFallbackStartButton ? (
                          <Pressable
                            accessibilityLabel="분석 없이 시뮬레이션 시작"
                            onPress={(event) => {
                              event.stopPropagation();
                              handleStartWithoutAnalysis();
                            }}
                            style={({ pressed }) => [
                              styles.startWithoutAnalysisButton,
                              pressed
                                ? styles.startWithoutAnalysisButtonPressed
                                : null,
                            ]}
                          >
                            <Ionicons
                              color={brand.colors.primaryText}
                              name="body-outline"
                              size={15}
                            />
                            <Text style={styles.startWithoutAnalysisButtonText}>
                              분석 없이 시작
                            </Text>
                          </Pressable>
                        ) : null}

                        {shouldShowRetryButton ? (
                          <Pressable
                            accessibilityLabel="사진 분석 다시 시도"
                            onPress={(event) => {
                              event.stopPropagation();
                              handleRetryAnalysis();
                            }}
                            style={({ pressed }) => [
                              styles.retryAnalysisButton,
                              pressed ? styles.retryAnalysisButtonPressed : null,
                            ]}
                          >
                            <Ionicons
                              color={brand.colors.text}
                              name="refresh"
                              size={15}
                            />
                            <Text style={styles.retryAnalysisButtonText}>
                              다시 시도
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </Pressable>
          ) : null}

          {shouldShowSkeletonOverlay &&
          viewport.width > 0 &&
          viewport.height > 0 ? (
            <SkeletonPoseOverlay
              ref={skeletonOverlayRef}
              allowEmptySpacePinchScale
              allowPinchScaleInSimulation
              characterRenderStyle="stickmanCharacterBlack"
              initialCenter={skeletonInitialCenter}
              mode={
                flowStep === "sizingSkeleton" ? "calibrating" : "simulating"
              }
              onHistoryStateChange={setSkeletonHistoryState}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          {flowStep === "routeEditing" ? (
            <View pointerEvents="box-none" style={styles.routeEditPanelOverlay}>
              <View pointerEvents="box-none" style={styles.routeEditPanel}>
                <View pointerEvents="none" style={styles.infoHeaderRow}>
                  <Text style={styles.infoEyebrow}>ROUTE EDIT</Text>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>
                      {routeResult
                        ? `${routeResult.includedObjectIds.length} route`
                        : `${holdCount} holds`}
                    </Text>
                  </View>
                </View>

                <Text pointerEvents="none" style={styles.routeEditHint}>
                  인식하지 못한 홀드는 탭해서 루트에 추가하세요.
                </Text>

                <View
                  pointerEvents="box-none"
                  style={styles.calibrationActionRow}
                >
                  <Pressable
                    onPress={handleReselectRoute}
                    style={({ pressed }) => [
                      styles.reselectButton,
                      styles.calibrationTextButton,
                      pressed ? styles.reselectButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.reselectButtonText}>
                      스타트 다시 선택
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFlowStep("sizingSkeleton")}
                    style={({ pressed }) => [
                      styles.calibrationConfirmButton,
                      pressed ? styles.calibrationConfirmButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.calibrationConfirmButtonText}>
                      다음
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {flowStep === "sizingSkeleton" ? (
            <View pointerEvents="box-none" style={styles.routeEditPanelOverlay}>
              <View pointerEvents="box-none" style={styles.routeEditPanel}>
                <View pointerEvents="none" style={styles.infoHeaderRow}>
                  <Text style={styles.infoEyebrow}>SKELETON FIT</Text>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>
                      {routeResult
                        ? `${routeResult.includedObjectIds.length} route`
                        : `${holdCount} holds`}
                    </Text>
                  </View>
                </View>

                <Text pointerEvents="none" style={styles.routeEditHint}>
                  두 손가락으로 크기를 맞추고, 끌어서 위치를 조정하세요.
                </Text>

                <View
                  pointerEvents="box-none"
                  style={styles.calibrationActionRow}
                >
                  <Pressable
                    onPress={() => setFlowStep("routeEditing")}
                    style={({ pressed }) => [
                      styles.reselectButton,
                      styles.calibrationTextButton,
                      pressed ? styles.reselectButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.reselectButtonText}>이전</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFlowStep("simulating")}
                    style={({ pressed }) => [
                      styles.calibrationConfirmButton,
                      pressed ? styles.calibrationConfirmButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.calibrationConfirmButtonText}>
                      완료
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.canvasTopOverlay}>
            {flowStep === "simulating" ? (
              <>
                <Pressable
                  accessibilityLabel="스켈레톤 이동 실행 취소"
                  disabled={!skeletonHistoryState.canUndo}
                  onPress={() => skeletonOverlayRef.current?.undo()}
                  style={[
                    styles.overlayIconButton,
                    !skeletonHistoryState.canUndo
                      ? styles.overlayIconButtonDisabled
                      : null,
                  ]}
                >
                  <Ionicons color="#ffffff" name="arrow-undo" size={19} />
                </Pressable>

                <Pressable
                  accessibilityLabel="스켈레톤 이동 다시 실행"
                  disabled={!skeletonHistoryState.canRedo}
                  onPress={() => skeletonOverlayRef.current?.redo()}
                  style={[
                    styles.overlayIconButton,
                    !skeletonHistoryState.canRedo
                      ? styles.overlayIconButtonDisabled
                      : null,
                  ]}
                >
                  <Ionicons color="#ffffff" name="arrow-redo" size={19} />
                </Pressable>
              </>
            ) : null}

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

          <Animated.View
            pointerEvents="none"
            style={[
              styles.simulationCue,
              {
                opacity: simulationCueOpacity,
                transform: [
                  { translateY: simulationCueTranslateY },
                  { scale: simulationCueScale },
                ],
              },
            ]}
          >
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              style={styles.simulationCueText}
            >
              이제 다음 무브를 확인해보세요!
            </Text>
          </Animated.View>
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
    backgroundColor: brand.colors.chrome,
  },
  screen: {
    flex: 1,
    backgroundColor: brand.colors.wall,
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
    top: 68,
  },
  infoCard: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(10, 10, 10, 0.58)",
  },
  routeEditPanelOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    zIndex: 20,
  },
  routeEditPanel: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(10, 10, 10, 0.68)",
  },
  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoEyebrow: {
    color: brand.colors.accent,
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
    color: brand.colors.accentSoft,
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
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 8,
    color: brand.colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  retryAnalysisButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: brand.colors.primary,
  },
  retryAnalysisButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  retryAnalysisButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  analysisFailureActions: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  startWithoutAnalysisButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: brand.colors.primary,
  },
  startWithoutAnalysisButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  startWithoutAnalysisButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  reselectButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  reselectButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  reselectButtonText: {
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  routeEditHint: {
    marginTop: 7,
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  calibrationActionRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calibrationTextButton: {
    marginTop: 0,
  },
  calibrationConfirmButton: {
    height: 31,
    minWidth: 56,
    borderRadius: 15.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    backgroundColor: brand.colors.primary,
  },
  calibrationConfirmButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  calibrationConfirmButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  simulationCue: {
    position: "absolute",
    top: 92,
    left: 10,
    right: 10,
    alignItems: "center",
  },
  simulationCueText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  overlayIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 15, 15, 0.68)",
  },
  overlayIconButtonDisabled: {
    opacity: 0.34,
  },
});
