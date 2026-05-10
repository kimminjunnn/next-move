import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import {
  clampSkeletonScale,
  createSkeletonBodyModel,
  DEFAULT_SKELETON_SCALE,
} from "../lib/bodyModel";
import {
  createDefaultSkeletonPose,
  getEndpointPosition,
  getSkeletonCenter,
  limitSkeletonPoseStepWithModel,
  resolveSkeletonBodyDrag,
  resolveSkeletonHeadDrag,
  resolveSkeletonJointDragWithMode,
  resolveSkeletonPoseDragWithMode,
  translateSkeletonPose,
} from "../lib/skeletonPoseSolver";
import {
  createSkeletonPoseHistory,
  pushSkeletonPoseHistory,
  redoSkeletonPoseHistory,
  undoSkeletonPoseHistory,
  type SkeletonPoseHistory,
  type SkeletonPoseSnapshot,
} from "../lib/skeletonPoseHistory";
import {
  getSkeletonOverlayPointerEvents,
  shouldAllowSkeletonPinchScale,
} from "../lib/skeletonPoseInteraction";
import { getSkeletonCharacterOverlayOpacity } from "../lib/skeletonCharacterVisibility";
import {
  getRupaCharacterTransformOptions,
  RUPA_BACK_CHARACTER_PARTS,
} from "../lib/rupaCharacterRig";
import { useBodyProfileStore } from "../store/useBodyProfileStore";
import type {
  CharacterRigPart,
  CharacterRigTransformOptions,
} from "../types/characterRig";
import type { Point2D } from "../types/geometry";
import type {
  SkeletonBodyModel,
  SkeletonControlJointName,
  SkeletonDragResolutionMode,
  SkeletonEndpointName,
  SkeletonPointMap,
  SkeletonPointName,
  SkeletonPose,
} from "../types/skeletonPose";
import { CharacterLayer } from "./RupaCharacterLayer";

type SkeletonPoseOverlayProps = {
  allowEmptySpacePinchScale?: boolean;
  allowPinchScaleInSimulation?: boolean;
  characterParts?: ReadonlyArray<CharacterRigPart>;
  getCharacterTransformOptions?: (
    pose: SkeletonPose,
    activeControlId: string | null,
  ) => CharacterRigTransformOptions;
  initialCenter?: Point2D;
  mode: "calibrating" | "simulating";
  onHistoryStateChange?: (state: SkeletonPoseOverlayHistoryState) => void;
  viewportHeight: number;
  viewportWidth: number;
};

export type SkeletonPoseOverlayHandle = {
  redo: () => void;
  undo: () => void;
};

export type SkeletonPoseOverlayHistoryState = {
  canRedo: boolean;
  canUndo: boolean;
};

const ENDPOINTS: SkeletonEndpointName[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

const CONTROL_JOINTS: SkeletonControlJointName[] = [
  "leftElbow",
  "rightElbow",
  "leftKnee",
  "rightKnee",
];

const BONES: Array<[SkeletonPointName, SkeletonPointName]> = [
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
const MIN_HEAD_HIT_SIZE = 34;
const MIN_BODY_HIT_SIZE = 40;
const ENDPOINT_PRIORITY_BONUS = 0.86;
const JOINT_PRIORITY_BONUS = 0.72;
const HEAD_PRIORITY_BONUS = 0.62;
const BODY_PRIORITY_BONUS = 1.18;
const MAX_DRAG_FRAME_DISTANCE = 22;
const MIN_DRAG_FRAME_DISTANCE = 10;

type SkeletonDragTarget =
  | { kind: "endpoint"; id: SkeletonEndpointName }
  | { kind: "joint"; id: SkeletonControlJointName }
  | { kind: "head" }
  | { kind: "body" };

type HitFrame = {
  left: number;
  top: number;
};

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
    headHitSize: Math.max(MIN_HEAD_HIT_SIZE, scale * 34),
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

function getEndpointAccessibilityLabel(endpointName: SkeletonEndpointName) {
  switch (endpointName) {
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

function getJointAccessibilityLabel(jointName: SkeletonControlJointName) {
  switch (jointName) {
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

  if (target.kind === "body" || target.kind === "head") {
    return target.kind;
  }

  return target.id;
}

function getDistanceSquared(a: Point2D, b: Point2D) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy;
}

function getPinchDistance(event: GestureResponderEvent) {
  const [firstTouch, secondTouch] = event.nativeEvent.touches;

  if (!firstTouch || !secondTouch) {
    return null;
  }

  return Math.hypot(
    firstTouch.pageX - secondTouch.pageX,
    firstTouch.pageY - secondTouch.pageY,
  );
}

function createDefaultPose(
  bodyModel: SkeletonBodyModel,
  viewportWidth: number,
  viewportHeight: number,
  initialCenter?: Point2D,
) {
  const defaultPose = createDefaultSkeletonPose(
    bodyModel,
    viewportWidth,
    viewportHeight,
  );

  if (!initialCenter) {
    return defaultPose;
  }

  const center = getSkeletonCenter(defaultPose);

  return translateSkeletonPose(defaultPose, {
    x: initialCenter.x - center.x,
    y: initialCenter.y - center.y,
  });
}

function scalePoseAroundCenter(
  pose: SkeletonPose,
  scaleRatio: number,
): SkeletonPose {
  const center = getSkeletonCenter(pose);
  const joints = Object.entries(pose.joints).reduce<SkeletonPointMap>(
    (scaledJoints, [jointName, point]) => ({
      ...scaledJoints,
      [jointName]: {
        x: center.x + (point.x - center.x) * scaleRatio,
        y: center.y + (point.y - center.y) * scaleRatio,
      },
    }),
    {} as SkeletonPointMap,
  );

  return { joints };
}

export const SkeletonPoseOverlay = forwardRef<
  SkeletonPoseOverlayHandle,
  SkeletonPoseOverlayProps
>(function SkeletonPoseOverlay(
  {
    allowEmptySpacePinchScale = false,
    allowPinchScaleInSimulation = false,
    characterParts = RUPA_BACK_CHARACTER_PARTS,
    getCharacterTransformOptions = getRupaCharacterTransformOptions,
    initialCenter,
    mode,
    onHistoryStateChange,
    viewportHeight,
    viewportWidth,
  },
  ref,
) {
  const { profile } = useBodyProfileStore();
  const initialCenterX = initialCenter?.x;
  const initialCenterY = initialCenter?.y;
  const [scale, setScale] = useState(DEFAULT_SKELETON_SCALE);
  const metrics = useMemo(() => getOverlayMetrics(scale), [scale]);
  const bodyModel = useMemo(
    () => createSkeletonBodyModel(profile, scale),
    [profile, scale],
  );
  const [pose, setPose] = useState<SkeletonPose>(() =>
    createDefaultPose(bodyModel, viewportWidth, viewportHeight, initialCenter),
  );
  const [historyState, setHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const shouldShowCharacter = mode === "simulating";
  const characterOpacity = getSkeletonCharacterOverlayOpacity({
    activeControlId,
    characterVisible: shouldShowCharacter,
  });
  const characterTransformOptions = useMemo(
    () => getCharacterTransformOptions(pose, activeControlId),
    [activeControlId, getCharacterTransformOptions, pose],
  );
  const activeDragTargetRef = useRef<SkeletonDragTarget | null>(null);
  const activeDragModeRef = useRef<SkeletonDragResolutionMode | null>(null);
  const dragStartPointRef = useRef<Point2D | null>(null);
  const dragStartPoseRef = useRef<SkeletonPose | null>(null);
  const dragStartSnapshotRef = useRef<SkeletonPoseSnapshot | null>(null);
  const historyRef = useRef<SkeletonPoseHistory>(createSkeletonPoseHistory());
  const bodyModelRef = useRef(bodyModel);
  const metricsRef = useRef(metrics);
  const modeRef = useRef(mode);
  const profileRef = useRef(profile);
  const poseRef = useRef(pose);
  const scaleRef = useRef(scale);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(scale);
  const hitFramesRef = useRef<Record<string, HitFrame>>({});

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    bodyModelRef.current = bodyModel;
  }, [bodyModel]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    onHistoryStateChange?.(historyState);
  }, [historyState, onHistoryStateChange]);

  useEffect(() => {
    const defaultPose = createDefaultPose(
      bodyModel,
      viewportWidth,
      viewportHeight,
      initialCenterX !== undefined && initialCenterY !== undefined
        ? { x: initialCenterX, y: initialCenterY }
        : undefined,
    );

    poseRef.current = defaultPose;
    setPose(defaultPose);
    clearHistory();
  }, [initialCenterX, initialCenterY, profile, viewportHeight, viewportWidth]);

  useImperativeHandle(
    ref,
    () => ({
      redo: redoPose,
      undo: undoPose,
    }),
    [],
  );

  function getCurrentSnapshot(): SkeletonPoseSnapshot {
    return {
      pose: poseRef.current,
      scale: scaleRef.current,
    };
  }

  function updateHistoryState(history: SkeletonPoseHistory) {
    setHistoryState({
      canRedo: history.future.length > 0,
      canUndo: history.past.length > 0,
    });
  }

  function clearHistory() {
    const history = createSkeletonPoseHistory();

    historyRef.current = history;
    updateHistoryState(history);
  }

  function areSnapshotsEqual(
    first: SkeletonPoseSnapshot,
    second: SkeletonPoseSnapshot,
  ) {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  function applySnapshot(snapshot: SkeletonPoseSnapshot) {
    const nextBodyModel = createSkeletonBodyModel(
      profileRef.current,
      snapshot.scale,
    );

    bodyModelRef.current = nextBodyModel;
    scaleRef.current = snapshot.scale;
    poseRef.current = snapshot.pose;
    setScale(snapshot.scale);
    setPose(snapshot.pose);
    setActiveDragTarget(null);
  }

  function commitPoseHistory(startSnapshot: SkeletonPoseSnapshot | null) {
    if (!startSnapshot) {
      return;
    }

    if (areSnapshotsEqual(startSnapshot, getCurrentSnapshot())) {
      return;
    }

    const history = pushSkeletonPoseHistory(historyRef.current, startSnapshot);

    historyRef.current = history;
    updateHistoryState(history);
  }

  function undoPose() {
    const result = undoSkeletonPoseHistory(
      historyRef.current,
      getCurrentSnapshot(),
    );

    if (!result.snapshot) {
      return;
    }

    historyRef.current = result.history;
    updateHistoryState(result.history);
    applySnapshot(result.snapshot);
  }

  function redoPose() {
    const result = redoSkeletonPoseHistory(
      historyRef.current,
      getCurrentSnapshot(),
    );

    if (!result.snapshot) {
      return;
    }

    historyRef.current = result.history;
    updateHistoryState(result.history);
    applySnapshot(result.snapshot);
  }

  function setActiveDragTarget(target: SkeletonDragTarget | null) {
    activeDragTargetRef.current = target;
    setActiveControlId(getDragTargetKey(target));
  }

  function beginEndpointDrag(endpointName: SkeletonEndpointName) {
    activeDragModeRef.current = null;
    dragStartPointRef.current = getEndpointPosition(
      poseRef.current,
      endpointName,
    );
    dragStartPoseRef.current = poseRef.current;
    dragStartSnapshotRef.current = getCurrentSnapshot();
    setActiveDragTarget({ kind: "endpoint", id: endpointName });
  }

  function beginJointDrag(jointName: SkeletonControlJointName) {
    activeDragModeRef.current = null;
    dragStartPointRef.current = poseRef.current.joints[jointName];
    dragStartPoseRef.current = poseRef.current;
    dragStartSnapshotRef.current = getCurrentSnapshot();
    setActiveDragTarget({ kind: "joint", id: jointName });
  }

  function beginHeadDrag() {
    activeDragModeRef.current = null;
    dragStartPointRef.current = poseRef.current.joints.head;
    dragStartPoseRef.current = poseRef.current;
    dragStartSnapshotRef.current = getCurrentSnapshot();
    setActiveDragTarget({ kind: "head" });
  }

  function beginBodyDrag() {
    activeDragModeRef.current = null;
    dragStartPointRef.current = null;
    dragStartPoseRef.current = poseRef.current;
    dragStartSnapshotRef.current = getCurrentSnapshot();
    setActiveDragTarget({ kind: "body" });
  }

  function scaleSkeletonTo(nextScale: number) {
    setScale((currentScale) => {
      const clampedScale = clampSkeletonScale(nextScale);

      if (clampedScale === currentScale) {
        return currentScale;
      }

      const scaleRatio = clampedScale / currentScale;
      const nextBodyModel = createSkeletonBodyModel(
        profileRef.current,
        clampedScale,
      );
      bodyModelRef.current = nextBodyModel;
      scaleRef.current = clampedScale;

      setPose((currentPose) => {
        const nextPose = scalePoseAroundCenter(currentPose, scaleRatio);

        poseRef.current = nextPose;
        return nextPose;
      });

      return clampedScale;
    });
  }

  function findNearestDragTarget(point: Point2D) {
    const isCharacterInteraction = modeRef.current === "simulating";
    const currentMetrics = metricsRef.current;
    const endpointMaxDistance =
      (isCharacterInteraction
        ? currentMetrics.endpointHitSize * 1.35
        : currentMetrics.endpointHitSize) / 2;
    const jointMaxDistance =
      (isCharacterInteraction
        ? currentMetrics.jointHitSize * 1.6
        : currentMetrics.jointHitSize) / 2;
    const headMaxDistance =
      (isCharacterInteraction
        ? currentMetrics.headHitSize * 1.45
        : currentMetrics.headHitSize) / 2;
    const bodyMaxDistance =
      (isCharacterInteraction
        ? currentMetrics.bodyHitSize * 1.85
        : currentMetrics.bodyHitSize) / 2;
    const candidates: Array<{
      center: Point2D;
      maxDistance: number;
      scoreMultiplier: number;
      target: SkeletonDragTarget;
    }> = [
      ...CONTROL_JOINTS.map((jointName) => ({
        center: poseRef.current.joints[jointName],
        maxDistance: jointMaxDistance,
        scoreMultiplier: JOINT_PRIORITY_BONUS,
        target: { kind: "joint", id: jointName } as SkeletonDragTarget,
      })),
      {
        center: poseRef.current.joints.head,
        maxDistance: headMaxDistance,
        scoreMultiplier: HEAD_PRIORITY_BONUS,
        target: { kind: "head" },
      },
      ...ENDPOINTS.map((endpointName) => ({
        center: getEndpointPosition(poseRef.current, endpointName),
        maxDistance: endpointMaxDistance,
        scoreMultiplier: ENDPOINT_PRIORITY_BONUS,
        target: { kind: "endpoint", id: endpointName } as SkeletonDragTarget,
      })),
      {
        center: getSkeletonCenter(poseRef.current),
        maxDistance: bodyMaxDistance,
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

  function beginNearestDrag(point: Point2D) {
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

    if (target.kind === "head") {
      beginHeadDrag();
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
    const maxDragFrameDistance = Math.max(
      MIN_DRAG_FRAME_DISTANCE,
      MAX_DRAG_FRAME_DISTANCE * scaleRef.current,
    );

    function settleDragPose(nextPose: SkeletonPose) {
      const limitedPose = limitSkeletonPoseStepWithModel(
        poseRef.current,
        nextPose,
        maxDragFrameDistance,
        bodyModelRef.current,
      );

      poseRef.current = limitedPose;
      return limitedPose;
    }

    if (!dragTarget) {
      return;
    }

    if (dragTarget.kind === "body") {
      const startPose = dragStartPoseRef.current;

      if (!startPose) {
        return;
      }

      const nextPose = resolveSkeletonBodyDrag(
        startPose,
        {
          delta: {
            x: gestureState.dx,
            y: gestureState.dy,
          },
        },
        bodyModelRef.current,
        modeRef.current,
      );

      setPose(settleDragPose(nextPose));
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
      const dragStartPose = dragStartPoseRef.current ?? currentPose;
      const nextPose =
        dragTarget.kind === "endpoint"
          ? (() => {
              const resolution = resolveSkeletonPoseDragWithMode(
                dragStartPose,
                {
                  endpointName: dragTarget.id,
                  target,
                  previousMode: activeDragModeRef.current,
                },
                bodyModelRef.current,
              );

              activeDragModeRef.current = resolution.mode;
              return resolution.pose;
            })()
          : dragTarget.kind === "head"
            ? resolveSkeletonHeadDrag(
                dragStartPoseRef.current ?? currentPose,
                {
                  target,
                },
                bodyModelRef.current,
              )
            : (() => {
                const resolution = resolveSkeletonJointDragWithMode(
                  dragStartPose,
                  {
                    jointName: dragTarget.id,
                    target,
                    previousMode: activeDragModeRef.current,
                  },
                  bodyModelRef.current,
                );

                activeDragModeRef.current = resolution.mode;
                return resolution.pose;
              })();

      return settleDragPose(nextPose);
    });
  }

  function endEndpointDrag() {
    commitPoseHistory(dragStartSnapshotRef.current);
    activeDragModeRef.current = null;
    dragStartPointRef.current = null;
    dragStartPoseRef.current = null;
    dragStartSnapshotRef.current = null;
    setActiveDragTarget(null);
  }

  function beginPinchScale(event: GestureResponderEvent) {
    const distance = getPinchDistance(event);

    if (
      !shouldAllowSkeletonPinchScale(
        modeRef.current,
        allowPinchScaleInSimulation,
      ) ||
      distance === null
    ) {
      return;
    }

    pinchStartDistanceRef.current = distance;
    pinchStartScaleRef.current = scaleRef.current;
    dragStartPointRef.current = null;
    dragStartPoseRef.current = null;
    dragStartSnapshotRef.current = getCurrentSnapshot();
    activeDragModeRef.current = null;
    setActiveDragTarget(null);
  }

  function movePinchScale(event: GestureResponderEvent) {
    const distance = getPinchDistance(event);
    const startDistance = pinchStartDistanceRef.current;

    if (
      !shouldAllowSkeletonPinchScale(
        modeRef.current,
        allowPinchScaleInSimulation,
      ) ||
      distance === null ||
      startDistance === null ||
      startDistance <= 0
    ) {
      return;
    }

    scaleSkeletonTo(pinchStartScaleRef.current * (distance / startDistance));
  }

  function endPinchScale() {
    commitPoseHistory(dragStartSnapshotRef.current);
    pinchStartDistanceRef.current = null;
    pinchStartScaleRef.current = scaleRef.current;
    dragStartSnapshotRef.current = null;
  }

  function shouldHandlePinch(event: GestureResponderEvent) {
    return (
      shouldAllowSkeletonPinchScale(
        modeRef.current,
        allowPinchScaleInSimulation,
      ) && event.nativeEvent.touches.length >= 2
    );
  }

  const endpointResponders = useMemo(
    () =>
      ENDPOINTS.reduce(
        (responders, endpointName) => {
          const hitFrameKey = `endpoint:${endpointName}`;

          responders[endpointName] = PanResponder.create({
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
        {} as Record<SkeletonEndpointName, ReturnType<typeof PanResponder.create>>,
      ),
    [],
  );

  const jointResponders = useMemo(
    () =>
      CONTROL_JOINTS.reduce(
        (responders, jointName) => {
          const hitFrameKey = `joint:${jointName}`;

          responders[jointName] = PanResponder.create({
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
          SkeletonControlJointName,
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

  const headResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          beginNearestDragFromHitFrame("head", event);
        },
        onPanResponderMove: (_event, gestureState) => {
          moveActiveDrag(gestureState);
        },
        onPanResponderRelease: endEndpointDrag,
        onPanResponderTerminate: endEndpointDrag,
      }),
    [],
  );

  const pinchResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: shouldHandlePinch,
        onMoveShouldSetPanResponderCapture: shouldHandlePinch,
        onPanResponderGrant: beginPinchScale,
        onPanResponderMove: movePinchScale,
        onPanResponderRelease: endPinchScale,
        onPanResponderTerminate: endPinchScale,
      }),
    [],
  );

  return (
    <View
      {...pinchResponder.panHandlers}
      pointerEvents={getSkeletonOverlayPointerEvents(
        allowEmptySpacePinchScale,
      )}
      style={styles.overlay}
    >
      <CharacterLayer
        bodyModel={bodyModel}
        opacity={characterOpacity.character}
        parts={characterParts}
        pose={pose}
        transformOptions={characterTransformOptions}
        visible={shouldShowCharacter}
      />

      <View pointerEvents="none" style={styles.skeletonLayer}>
        <Svg height="100%" width="100%">
          {BONES.map(([from, to]) => (
            <Line
              key={`${from}-${to}`}
              opacity={characterOpacity.bone}
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
            fill={
              activeControlId === "head"
                ? "rgba(255,179,122,0.24)"
                : "rgba(255,255,255,0.08)"
            }
            opacity={
              activeControlId === "head" && !shouldShowCharacter
                ? 1
                : characterOpacity.head
            }
            r={bodyModel.headRadius}
            stroke={
              activeControlId === "head" ? "#ffb37a" : "rgba(255,255,255,0.72)"
            }
            strokeWidth={
              activeControlId === "head"
                ? metrics.headStrokeWidth + 1
                : metrics.headStrokeWidth
            }
          />

          <Circle
            cx={getSkeletonCenter(pose).x}
            cy={getSkeletonCenter(pose).y}
            fill={
              activeControlId === "body"
                ? "#ffb37a"
                : "rgba(122,214,255,0.74)"
            }
            opacity={
              activeControlId === "body" && !shouldShowCharacter
                ? 1
                : characterOpacity.body
            }
            r={
              activeControlId === "body"
                ? metrics.bodyActiveRadius
                : metrics.bodyRadius
            }
            stroke="rgba(15,15,15,0.9)"
            strokeWidth={2.4}
          />

          {CONTROL_JOINTS.map((jointName) => {
            const point = pose.joints[jointName];
            const isActive = jointName === activeControlId;

            return (
              <Circle
                key={jointName}
                cx={point.x}
                cy={point.y}
                fill={isActive ? "#ffb37a" : "rgba(255,255,255,0.74)"}
                opacity={
                  isActive && !shouldShowCharacter
                    ? 1
                    : characterOpacity.inactiveJoint
                }
                r={isActive ? metrics.jointActiveRadius : metrics.jointRadius}
                stroke="rgba(15,15,15,0.84)"
                strokeWidth={2.2}
              />
            );
          })}

          {ENDPOINTS.map((endpointName) => {
            const point = pose.joints[endpointName];
            const isActive = endpointName === activeControlId;

            return (
              <Circle
                key={endpointName}
                cx={point.x}
                cy={point.y}
                fill={isActive ? "#ffb37a" : "rgba(255,255,255,0.88)"}
                opacity={
                  isActive && !shouldShowCharacter
                    ? 1
                    : characterOpacity.inactiveEndpoint
                }
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
        accessibilityHint={
          shouldShowCharacter
            ? "끌어서 캐릭터 전체 위치를 조정합니다."
            : "끌어서 스켈레톤 전체 위치를 조정합니다."
        }
        accessibilityLabel={
          shouldShowCharacter ? "캐릭터 전체 이동" : "스켈레톤 전체 이동"
        }
        style={[
          styles.bodyHitArea,
          (() => {
            const center = getSkeletonCenter(pose);
            const hitSize = shouldShowCharacter
              ? metrics.bodyHitSize * 1.85
              : metrics.bodyHitSize;
            const frame = {
              left: center.x - hitSize / 2,
              top: center.y - hitSize / 2,
            };

            hitFramesRef.current.body = frame;

            return {
              ...frame,
              width: hitSize,
              height: hitSize,
              borderRadius: hitSize / 2,
            };
          })(),
        ]}
      />

      <View
        {...headResponder.panHandlers}
        accessibilityHint="끌어서 머리 방향을 조정합니다."
        accessibilityLabel="머리 이동"
        style={[
          styles.headHitArea,
          (() => {
            const point = pose.joints.head;
            const hitSize = shouldShowCharacter
              ? metrics.headHitSize * 1.45
              : metrics.headHitSize;
            const frame = {
              left: point.x - hitSize / 2,
              top: point.y - hitSize / 2,
            };

            hitFramesRef.current.head = frame;

            return {
              ...frame,
              width: hitSize,
              height: hitSize,
              borderRadius: hitSize / 2,
            };
          })(),
        ]}
      />

      {ENDPOINTS.map((endpointName) => {
        const point = pose.joints[endpointName];
        const hitFrameKey = `endpoint:${endpointName}`;
        const hitSize = shouldShowCharacter
          ? metrics.endpointHitSize * 1.35
          : metrics.endpointHitSize;
        const frame = {
          left: point.x - hitSize / 2,
          top: point.y - hitSize / 2,
        };

        hitFramesRef.current[hitFrameKey] = frame;

        return (
          <View
            key={endpointName}
            {...endpointResponders[endpointName].panHandlers}
            accessibilityLabel={getEndpointAccessibilityLabel(endpointName)}
            accessibilityHint="끌어서 손이나 발 위치를 조정합니다."
            style={[
              styles.handleHitArea,
              {
                ...frame,
                width: hitSize,
                height: hitSize,
                borderRadius: hitSize / 2,
              },
            ]}
          />
        );
      })}

      {CONTROL_JOINTS.map((jointName) => {
        const point = pose.joints[jointName];
        const hitFrameKey = `joint:${jointName}`;
        const hitSize = shouldShowCharacter
          ? metrics.jointHitSize * 1.6
          : metrics.jointHitSize;
        const frame = {
          left: point.x - hitSize / 2,
          top: point.y - hitSize / 2,
        };

        hitFramesRef.current[hitFrameKey] = frame;

        return (
          <View
            key={jointName}
            {...jointResponders[jointName].panHandlers}
            accessibilityLabel={getJointAccessibilityLabel(jointName)}
            accessibilityHint="끌어서 팔꿈치나 무릎 방향을 조정합니다."
            style={[
              styles.jointHitArea,
              {
                ...frame,
                width: hitSize,
                height: hitSize,
                borderRadius: hitSize / 2,
              },
            ]}
          />
        );
      })}

    </View>
  );
});

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
  headHitArea: {
    position: "absolute",
  },
  bodyHitArea: {
    position: "absolute",
  },
});
