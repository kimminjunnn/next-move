import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import {
  clampSkeletonScale,
  createSkeletonBodyModel,
  DEFAULT_SKELETON_SCALE,
  MAX_SKELETON_SCALE,
  MIN_SKELETON_SCALE,
  SKELETON_SCALE_STEP,
} from "../lib/bodyModel";
import {
  createDefaultSkeletonPose,
  getEndpointPosition,
  getSkeletonCenter,
  resolveSkeletonJointDrag,
  resolveSkeletonPoseDrag,
  translateSkeletonPose,
} from "../lib/skeletonPoseSolver";
import { useBodyProfileStore } from "../store/useBodyProfileStore";
import type { SimulationPoint } from "../types/simulation";
import type {
  SkeletonBodyModel,
  SkeletonControlJointId,
  SkeletonEndpointId,
  SkeletonJointMap,
  SkeletonJointId,
  SkeletonPose,
} from "../types/skeletonPose";

type SkeletonPoseOverlayProps = {
  viewportHeight: number;
  viewportWidth: number;
};

const ENDPOINTS: SkeletonEndpointId[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

const CONTROL_JOINTS: SkeletonControlJointId[] = [
  "leftElbow",
  "rightElbow",
  "leftKnee",
  "rightKnee",
];

const BONES: Array<[SkeletonJointId, SkeletonJointId]> = [
  ["head", "neck"],
  ["neck", "torso"],
  ["torso", "pelvis"],
  ["neck", "leftShoulder"],
  ["neck", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftHand"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightHand"],
  ["pelvis", "leftHip"],
  ["pelvis", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftFoot"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightFoot"],
];

const MIN_ENDPOINT_HIT_SIZE = 34;
const MIN_JOINT_HIT_SIZE = 30;
const MIN_BODY_HIT_SIZE = 40;
const ENDPOINT_PRIORITY_BONUS = 0.86;
const JOINT_PRIORITY_BONUS = 0.72;
const BODY_PRIORITY_BONUS = 1.18;

type SkeletonDragTarget =
  | { kind: "endpoint"; id: SkeletonEndpointId }
  | { kind: "joint"; id: SkeletonControlJointId }
  | { kind: "body" };

type HitFrame = {
  left: number;
  top: number;
};

function formatScale(scale: number) {
  return `${Math.round(scale * 100)}%`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getOverlayMetrics(scale: number) {
  const endpointRadius = clampNumber(scale * 17, 5.5, 12);
  const jointRadius = clampNumber(scale * 12.5, 4, 8);
  const bodyRadius = clampNumber(scale * 14, 5, 9);

  return {
    boneStrokeWidth: clampNumber(scale * 7.5, 2.8, 5),
    headStrokeWidth: clampNumber(scale * 5.2, 2.4, 4),
    endpointRadius,
    endpointActiveRadius: endpointRadius + 3,
    endpointHitSize: Math.max(MIN_ENDPOINT_HIT_SIZE, endpointRadius * 3.2),
    jointRadius,
    jointActiveRadius: jointRadius + 2.5,
    jointHitSize: Math.max(MIN_JOINT_HIT_SIZE, jointRadius * 3.4),
    bodyRadius,
    bodyActiveRadius: bodyRadius + 2.5,
    bodyHitSize: Math.max(MIN_BODY_HIT_SIZE, bodyRadius * 4),
  };
}

function getEndpointAccessibilityLabel(endpointId: SkeletonEndpointId) {
  switch (endpointId) {
    case "leftHand":
      return "왼손 이동";
    case "rightHand":
      return "오른손 이동";
    case "leftFoot":
      return "왼발 이동";
    case "rightFoot":
      return "오른발 이동";
  }
}

function getJointAccessibilityLabel(jointId: SkeletonControlJointId) {
  switch (jointId) {
    case "leftElbow":
      return "왼팔꿈치 이동";
    case "rightElbow":
      return "오른팔꿈치 이동";
    case "leftKnee":
      return "왼무릎 이동";
    case "rightKnee":
      return "오른무릎 이동";
  }
}

function getDragTargetKey(target: SkeletonDragTarget | null) {
  if (!target) {
    return null;
  }

  return target.kind === "body" ? "body" : target.id;
}

function getDistanceSquared(a: SimulationPoint, b: SimulationPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy;
}

function createDefaultPose(
  bodyModel: SkeletonBodyModel,
  viewportWidth: number,
  viewportHeight: number,
) {
  return createDefaultSkeletonPose(bodyModel, viewportWidth, viewportHeight);
}

function scalePoseAroundCenter(
  pose: SkeletonPose,
  scaleRatio: number,
): SkeletonPose {
  const center = getSkeletonCenter(pose);
  const joints = Object.entries(pose.joints).reduce<SkeletonJointMap>(
    (scaledJoints, [jointId, point]) => ({
      ...scaledJoints,
      [jointId]: {
        x: center.x + (point.x - center.x) * scaleRatio,
        y: center.y + (point.y - center.y) * scaleRatio,
      },
    }),
    {} as SkeletonJointMap,
  );

  return { joints };
}

export function SkeletonPoseOverlay({
  viewportHeight,
  viewportWidth,
}: SkeletonPoseOverlayProps) {
  const { profile } = useBodyProfileStore();
  const [scale, setScale] = useState(DEFAULT_SKELETON_SCALE);
  const metrics = useMemo(() => getOverlayMetrics(scale), [scale]);
  const bodyModel = useMemo(
    () => createSkeletonBodyModel(profile, scale),
    [profile, scale],
  );
  const [pose, setPose] = useState<SkeletonPose>(() =>
    createDefaultPose(bodyModel, viewportWidth, viewportHeight),
  );
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const activeDragTargetRef = useRef<SkeletonDragTarget | null>(null);
  const dragStartPointRef = useRef<SimulationPoint | null>(null);
  const dragStartPoseRef = useRef<SkeletonPose | null>(null);
  const bodyModelRef = useRef(bodyModel);
  const poseRef = useRef(pose);
  const hitFramesRef = useRef<Record<string, HitFrame>>({});

  useEffect(() => {
    bodyModelRef.current = bodyModel;
  }, [bodyModel]);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    const defaultPose = createDefaultPose(
      bodyModel,
      viewportWidth,
      viewportHeight,
    );

    poseRef.current = defaultPose;
    setPose(defaultPose);
  }, [profile, viewportHeight, viewportWidth]);

  function setActiveDragTarget(target: SkeletonDragTarget | null) {
    activeDragTargetRef.current = target;
    setActiveControlId(getDragTargetKey(target));
  }

  function beginEndpointDrag(endpointId: SkeletonEndpointId) {
    dragStartPointRef.current = getEndpointPosition(
      poseRef.current,
      endpointId,
    );
    dragStartPoseRef.current = null;
    setActiveDragTarget({ kind: "endpoint", id: endpointId });
  }

  function beginJointDrag(jointId: SkeletonControlJointId) {
    dragStartPointRef.current = poseRef.current.joints[jointId];
    dragStartPoseRef.current = null;
    setActiveDragTarget({ kind: "joint", id: jointId });
  }

  function beginBodyDrag() {
    dragStartPointRef.current = null;
    dragStartPoseRef.current = poseRef.current;
    setActiveDragTarget({ kind: "body" });
  }

  function findNearestDragTarget(point: SimulationPoint) {
    const candidates: Array<{
      center: SimulationPoint;
      maxDistance: number;
      scoreMultiplier: number;
      target: SkeletonDragTarget;
    }> = [
      ...CONTROL_JOINTS.map((jointId) => ({
        center: poseRef.current.joints[jointId],
        maxDistance: metrics.jointHitSize / 2,
        scoreMultiplier: JOINT_PRIORITY_BONUS,
        target: { kind: "joint", id: jointId } as SkeletonDragTarget,
      })),
      ...ENDPOINTS.map((endpointId) => ({
        center: getEndpointPosition(poseRef.current, endpointId),
        maxDistance: metrics.endpointHitSize / 2,
        scoreMultiplier: ENDPOINT_PRIORITY_BONUS,
        target: { kind: "endpoint", id: endpointId } as SkeletonDragTarget,
      })),
      {
        center: getSkeletonCenter(poseRef.current),
        maxDistance: metrics.bodyHitSize / 2,
        scoreMultiplier: BODY_PRIORITY_BONUS,
        target: { kind: "body" },
      },
    ];
    const nearest = candidates.reduce<{
      score: number;
      target: SkeletonDragTarget;
    } | null>((currentNearest, candidate) => {
      const distanceSquared = getDistanceSquared(point, candidate.center);

      if (distanceSquared > candidate.maxDistance * candidate.maxDistance) {
        return currentNearest;
      }

      const score = distanceSquared * candidate.scoreMultiplier;

      if (!currentNearest || score < currentNearest.score) {
        return {
          score,
          target: candidate.target,
        };
      }

      return currentNearest;
    }, null);

    return nearest?.target ?? null;
  }

  function beginNearestDrag(point: SimulationPoint) {
    const target = findNearestDragTarget(point);

    if (!target) {
      return;
    }

    if (target.kind === "endpoint") {
      beginEndpointDrag(target.id);
      return;
    }

    if (target.kind === "joint") {
      beginJointDrag(target.id);
      return;
    }

    beginBodyDrag();
  }

  function beginNearestDragFromHitFrame(
    hitFrameKey: string,
    event: GestureResponderEvent,
  ) {
    const hitFrame = hitFramesRef.current[hitFrameKey];

    if (!hitFrame) {
      return;
    }

    beginNearestDrag({
      x: hitFrame.left + event.nativeEvent.locationX,
      y: hitFrame.top + event.nativeEvent.locationY,
    });
  }

  function moveActiveDrag(gestureState: PanResponderGestureState) {
    const dragTarget = activeDragTargetRef.current;
    const startPoint = dragStartPointRef.current;

    if (!dragTarget) {
      return;
    }

    if (dragTarget.kind === "body") {
      const startPose = dragStartPoseRef.current;

      if (!startPose) {
        return;
      }

      const nextPose = translateSkeletonPose(startPose, {
        x: gestureState.dx,
        y: gestureState.dy,
      });

      poseRef.current = nextPose;
      setPose(nextPose);
      return;
    }

    if (!startPoint) {
      return;
    }

    const target = {
      x: startPoint.x + gestureState.dx,
      y: startPoint.y + gestureState.dy,
    };

    setPose((currentPose) => {
      const nextPose =
        dragTarget.kind === "endpoint"
          ? resolveSkeletonPoseDrag(
              currentPose,
              {
                endpointId: dragTarget.id,
                target,
              },
              bodyModelRef.current,
            )
          : resolveSkeletonJointDrag(
              currentPose,
              {
                jointId: dragTarget.id,
                target,
              },
              bodyModelRef.current,
            );

      poseRef.current = nextPose;
      return nextPose;
    });
  }

  function endEndpointDrag() {
    dragStartPointRef.current = null;
    dragStartPoseRef.current = null;
    setActiveDragTarget(null);
  }

  const endpointResponders = useMemo(
    () =>
      ENDPOINTS.reduce(
        (responders, endpointId) => {
          const hitFrameKey = `endpoint:${endpointId}`;

          responders[endpointId] = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => {
              beginNearestDragFromHitFrame(hitFrameKey, event);
            },
            onPanResponderMove: (_event, gestureState) => {
              moveActiveDrag(gestureState);
            },
            onPanResponderRelease: endEndpointDrag,
            onPanResponderTerminate: endEndpointDrag,
          });

          return responders;
        },
        {} as Record<SkeletonEndpointId, ReturnType<typeof PanResponder.create>>,
      ),
    [],
  );

  const jointResponders = useMemo(
    () =>
      CONTROL_JOINTS.reduce(
        (responders, jointId) => {
          const hitFrameKey = `joint:${jointId}`;

          responders[jointId] = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => {
              beginNearestDragFromHitFrame(hitFrameKey, event);
            },
            onPanResponderMove: (_event, gestureState) => {
              moveActiveDrag(gestureState);
            },
            onPanResponderRelease: endEndpointDrag,
            onPanResponderTerminate: endEndpointDrag,
          });

          return responders;
        },
        {} as Record<
          SkeletonControlJointId,
          ReturnType<typeof PanResponder.create>
        >,
      ),
    [],
  );

  const bodyResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          beginNearestDragFromHitFrame("body", event);
        },
        onPanResponderMove: (_event, gestureState) => {
          moveActiveDrag(gestureState);
        },
        onPanResponderRelease: endEndpointDrag,
        onPanResponderTerminate: endEndpointDrag,
      }),
    [],
  );

  function resetPose() {
    const defaultPose = createDefaultPose(
      bodyModel,
      viewportWidth,
      viewportHeight,
    );

    poseRef.current = defaultPose;
    setPose(defaultPose);
  }

  function nudgeScale(direction: 1 | -1) {
    setScale((currentScale) => {
      const nextScale = clampSkeletonScale(
        currentScale + SKELETON_SCALE_STEP * direction,
      );

      if (nextScale === currentScale) {
        return currentScale;
      }

      const scaleRatio = nextScale / currentScale;
      bodyModelRef.current = createSkeletonBodyModel(profile, nextScale);

      setPose((currentPose) => {
        const nextPose = scalePoseAroundCenter(currentPose, scaleRatio);

        poseRef.current = nextPose;
        return nextPose;
      });

      return nextScale;
    });
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View pointerEvents="none" style={styles.skeletonLayer}>
        <Svg height="100%" width="100%">
          {BONES.map(([from, to]) => (
            <Line
              key={`${from}-${to}`}
              opacity={activeControlId ? 0.72 : 1}
              stroke="rgba(255,255,255,0.72)"
              strokeLinecap="round"
              strokeWidth={metrics.boneStrokeWidth}
              x1={pose.joints[from].x}
              x2={pose.joints[to].x}
              y1={pose.joints[from].y}
              y2={pose.joints[to].y}
            />
          ))}

          <Circle
            cx={pose.joints.head.x}
            cy={pose.joints.head.y}
            fill="rgba(255,255,255,0.08)"
            r={bodyModel.headRadius}
            stroke="rgba(255,255,255,0.72)"
            strokeWidth={metrics.headStrokeWidth}
          />

          <Circle
            cx={getSkeletonCenter(pose).x}
            cy={getSkeletonCenter(pose).y}
            fill={
              activeControlId === "body"
                ? "#ffb37a"
                : "rgba(122,214,255,0.74)"
            }
            opacity={activeControlId && activeControlId !== "body" ? 0.55 : 1}
            r={
              activeControlId === "body"
                ? metrics.bodyActiveRadius
                : metrics.bodyRadius
            }
            stroke="rgba(15,15,15,0.9)"
            strokeWidth={2.4}
          />

          {CONTROL_JOINTS.map((jointId) => {
            const point = pose.joints[jointId];
            const isActive = jointId === activeControlId;

            return (
              <Circle
                key={jointId}
                cx={point.x}
                cy={point.y}
                fill={isActive ? "#ffb37a" : "rgba(255,255,255,0.74)"}
                opacity={activeControlId && !isActive ? 0.5 : 1}
                r={isActive ? metrics.jointActiveRadius : metrics.jointRadius}
                stroke="rgba(15,15,15,0.84)"
                strokeWidth={2.2}
              />
            );
          })}

          {ENDPOINTS.map((endpointId) => {
            const point = pose.joints[endpointId];
            const isActive = endpointId === activeControlId;

            return (
              <Circle
                key={endpointId}
                cx={point.x}
                cy={point.y}
                fill={isActive ? "#ffb37a" : "rgba(255,255,255,0.88)"}
                opacity={activeControlId && !isActive ? 0.58 : 1}
                r={
                  isActive
                    ? metrics.endpointActiveRadius
                    : metrics.endpointRadius
                }
                stroke="rgba(15,15,15,0.9)"
                strokeWidth={2.4}
              />
            );
          })}
        </Svg>
      </View>

      <View
        {...bodyResponder.panHandlers}
        accessibilityHint="끌어서 스켈레톤 전체 위치를 조정합니다."
        accessibilityLabel="스켈레톤 전체 이동"
        style={[
          styles.bodyHitArea,
          (() => {
            const center = getSkeletonCenter(pose);
            const frame = {
              left: center.x - metrics.bodyHitSize / 2,
              top: center.y - metrics.bodyHitSize / 2,
            };

            hitFramesRef.current.body = frame;

            return {
              ...frame,
              width: metrics.bodyHitSize,
              height: metrics.bodyHitSize,
              borderRadius: metrics.bodyHitSize / 2,
            };
          })(),
        ]}
      />

      {ENDPOINTS.map((endpointId) => {
        const point = pose.joints[endpointId];
        const hitFrameKey = `endpoint:${endpointId}`;
        const frame = {
          left: point.x - metrics.endpointHitSize / 2,
          top: point.y - metrics.endpointHitSize / 2,
        };

        hitFramesRef.current[hitFrameKey] = frame;

        return (
          <View
            key={endpointId}
            {...endpointResponders[endpointId].panHandlers}
            accessibilityLabel={getEndpointAccessibilityLabel(endpointId)}
            accessibilityHint="끌어서 손이나 발 위치를 조정합니다."
            style={[
              styles.handleHitArea,
              {
                ...frame,
                width: metrics.endpointHitSize,
                height: metrics.endpointHitSize,
                borderRadius: metrics.endpointHitSize / 2,
              },
            ]}
          />
        );
      })}

      {CONTROL_JOINTS.map((jointId) => {
        const point = pose.joints[jointId];
        const hitFrameKey = `joint:${jointId}`;
        const frame = {
          left: point.x - metrics.jointHitSize / 2,
          top: point.y - metrics.jointHitSize / 2,
        };

        hitFramesRef.current[hitFrameKey] = frame;

        return (
          <View
            key={jointId}
            {...jointResponders[jointId].panHandlers}
            accessibilityLabel={getJointAccessibilityLabel(jointId)}
            accessibilityHint="끌어서 팔꿈치나 무릎 방향을 조정합니다."
            style={[
              styles.jointHitArea,
              {
                ...frame,
                width: metrics.jointHitSize,
                height: metrics.jointHitSize,
                borderRadius: metrics.jointHitSize / 2,
              },
            ]}
          />
        );
      })}

      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="스켈레톤 축소"
          disabled={scale <= MIN_SKELETON_SCALE}
          onPress={() => nudgeScale(-1)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.iconButtonPressed : null,
            scale <= MIN_SKELETON_SCALE ? styles.iconButtonDisabled : null,
          ]}
        >
          <Ionicons color="#ffffff" name="remove" size={18} />
        </Pressable>

        <Text style={styles.scaleLabel}>{formatScale(scale)}</Text>

        <Pressable
          accessibilityLabel="스켈레톤 확대"
          disabled={scale >= MAX_SKELETON_SCALE}
          onPress={() => nudgeScale(1)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.iconButtonPressed : null,
            scale >= MAX_SKELETON_SCALE ? styles.iconButtonDisabled : null,
          ]}
        >
          <Ionicons color="#ffffff" name="add" size={18} />
        </Pressable>

        <Pressable
          accessibilityLabel="스켈레톤 초기화"
          onPress={resetPose}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.iconButtonPressed : null,
          ]}
        >
          <Ionicons color="#ffffff" name="refresh" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  skeletonLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  handleHitArea: {
    position: "absolute",
  },
  jointHitArea: {
    position: "absolute",
  },
  bodyHitArea: {
    position: "absolute",
  },
  controls: {
    position: "absolute",
    left: 14,
    bottom: 136,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(10,10,10,0.42)",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  iconButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  scaleLabel: {
    minWidth: 42,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
