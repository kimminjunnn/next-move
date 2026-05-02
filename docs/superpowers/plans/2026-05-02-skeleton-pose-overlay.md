# Skeleton Pose Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a photo-overlay skeleton pose editor where users can drag hands and feet, scale the body, reset the pose, and see a human-like 2D skeleton react without relying on hold detection.

**Architecture:** Keep the feature in the Expo app. Split the work into pure body-model and solver modules, then mount a focused React Native SVG overlay on `SimulationCanvasStage`. The solver operates in viewport coordinates for the MVP and remains isolated so future hold snapping, calibration, or physics can be added without rewriting the UI.

**Tech Stack:** Expo React Native, TypeScript strict mode, `react-native-svg`, existing `react-native-gesture-handler` dependency where practical, existing Zustand stores, `npx tsc --noEmit` for verification.

**Repository Override:** `AGENTS.md` says not to commit unless the user explicitly asks. Treat each "Commit checkpoint" as a local diff review checkpoint; do not run `git commit` during execution unless the user separately requests it.

---

## File Structure

- Create `src/types/skeletonPose.ts`
  - Owns skeleton joint ids, limb endpoint ids, body segment dimensions, and pose state types.

- Create `src/lib/bodyModel.ts`
  - Converts `BodyProfile` height and wingspan into screen-scaled body segment lengths.
  - Contains no React code.

- Create `src/lib/skeletonPoseSolver.ts`
  - Creates default poses.
  - Resolves hand and foot drags with limb-length constraints.
  - Moves torso/shoulder/hip toward unreachable targets before clamping endpoints.
  - Contains no React code.

- Create `src/components/SkeletonPoseOverlay.tsx`
  - Renders skeleton lines and endpoint handles on top of the photo canvas.
  - Owns hand and foot drag interaction, scale controls, and reset control.
  - Reads body profile from `useBodyProfileStore`.

- Modify `src/components/SimulationCanvasStage.tsx`
  - Mounts `SkeletonPoseOverlay` above the photo/route highlight layer and below the top utility buttons.

No Nest API or vision-service files are part of this plan.

---

## Task 1: Add Skeleton Pose Types

**Files:**
- Create: `src/types/skeletonPose.ts`

- [ ] **Step 1: Create the shared skeleton types**

Add `src/types/skeletonPose.ts`:

```ts
import type { SimulationPoint } from "./simulation";

export type SkeletonEndpointId =
  | "leftHand"
  | "rightHand"
  | "leftFoot"
  | "rightFoot";

export type SkeletonJointId =
  | "head"
  | "neck"
  | "torso"
  | "pelvis"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftHand"
  | "rightHand"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftFoot"
  | "rightFoot";

export type SkeletonJointMap = Record<SkeletonJointId, SimulationPoint>;

export type SkeletonBodyModel = {
  height: number;
  wingspan: number;
  scale: number;
  headRadius: number;
  neckToTorso: number;
  torsoToPelvis: number;
  shoulderWidth: number;
  hipWidth: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
};

export type SkeletonPose = {
  joints: SkeletonJointMap;
};

export type SkeletonDragInput = {
  endpointId: SkeletonEndpointId;
  target: SimulationPoint;
};
```

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors from src/types/skeletonPose.ts.
```

- [ ] **Step 3: Diff checkpoint**

Run:

```bash
git diff -- src/types/skeletonPose.ts
```

Expected: the diff only contains the new shared type file.

---

## Task 2: Add Body Profile to Segment Model

**Files:**
- Create: `src/lib/bodyModel.ts`
- Read: `src/types/bodyProfile.ts`
- Read: `src/types/skeletonPose.ts`

- [ ] **Step 1: Implement the body model derivation**

Add `src/lib/bodyModel.ts`:

```ts
import type { BodyProfile } from "../types/bodyProfile";
import type { SkeletonBodyModel } from "../types/skeletonPose";

const BASE_PIXELS_PER_CM = 2.4;

export const DEFAULT_SKELETON_SCALE = 1;
export const MIN_SKELETON_SCALE = 0.55;
export const MAX_SKELETON_SCALE = 1.8;
export const SKELETON_SCALE_STEP = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampSkeletonScale(scale: number) {
  return clamp(scale, MIN_SKELETON_SCALE, MAX_SKELETON_SCALE);
}

function cmToViewportPoints(value: number, scale: number) {
  return value * BASE_PIXELS_PER_CM * scale;
}

export function createSkeletonBodyModel(
  profile: BodyProfile,
  scale: number,
): SkeletonBodyModel {
  const clampedScale = clampSkeletonScale(scale);
  const halfWingspan = profile.wingspan / 2;
  const armSegment = halfWingspan * 0.48;

  return {
    height: profile.height,
    wingspan: profile.wingspan,
    scale: clampedScale,
    headRadius: cmToViewportPoints(profile.height * 0.035, clampedScale),
    neckToTorso: cmToViewportPoints(profile.height * 0.11, clampedScale),
    torsoToPelvis: cmToViewportPoints(profile.height * 0.17, clampedScale),
    shoulderWidth: cmToViewportPoints(profile.height * 0.23, clampedScale),
    hipWidth: cmToViewportPoints(profile.height * 0.16, clampedScale),
    upperArm: cmToViewportPoints(armSegment, clampedScale),
    forearm: cmToViewportPoints(armSegment, clampedScale),
    thigh: cmToViewportPoints(profile.height * 0.245, clampedScale),
    shin: cmToViewportPoints(profile.height * 0.246, clampedScale),
  };
}
```

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors from src/lib/bodyModel.ts.
```

- [ ] **Step 3: Diff checkpoint**

Run:

```bash
git diff -- src/lib/bodyModel.ts src/types/skeletonPose.ts
```

Expected: model code has no React imports and only depends on `BodyProfile` and skeleton types.

---

## Task 3: Add the Pure Skeleton Pose Solver

**Files:**
- Create: `src/lib/skeletonPoseSolver.ts`
- Read: `src/types/skeletonPose.ts`
- Read: `src/types/simulation.ts`

- [ ] **Step 1: Implement vector helpers and default pose**

Add the first half of `src/lib/skeletonPoseSolver.ts`:

```ts
import type { SimulationPoint } from "../types/simulation";
import type {
  SkeletonBodyModel,
  SkeletonDragInput,
  SkeletonEndpointId,
  SkeletonJointMap,
  SkeletonPose,
} from "../types/skeletonPose";

const TORSO_FOLLOW_RATIO = 0.38;

function add(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scaleVector(point: SimulationPoint, scale: number): SimulationPoint {
  return { x: point.x * scale, y: point.y * scale };
}

function distance(a: SimulationPoint, b: SimulationPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampDistance(
  origin: SimulationPoint,
  target: SimulationPoint,
  maxDistance: number,
): SimulationPoint {
  const currentDistance = distance(origin, target);

  if (currentDistance <= maxDistance || currentDistance === 0) {
    return target;
  }

  const ratio = maxDistance / currentDistance;
  return {
    x: origin.x + (target.x - origin.x) * ratio,
    y: origin.y + (target.y - origin.y) * ratio,
  };
}

function midpoint(a: SimulationPoint, b: SimulationPoint): SimulationPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function rotate90(point: SimulationPoint, direction: 1 | -1): SimulationPoint {
  return {
    x: -point.y * direction,
    y: point.x * direction,
  };
}

function solveTwoBoneJoint(
  root: SimulationPoint,
  target: SimulationPoint,
  firstLength: number,
  secondLength: number,
  bendDirection: 1 | -1,
): { joint: SimulationPoint; endpoint: SimulationPoint } {
  const maxReach = firstLength + secondLength;
  const endpoint = clampDistance(root, target, maxReach);
  const rootToEndpoint = subtract(endpoint, root);
  const endpointDistance = Math.max(distance(root, endpoint), 0.001);
  const alongDistance =
    (firstLength * firstLength -
      secondLength * secondLength +
      endpointDistance * endpointDistance) /
    (2 * endpointDistance);
  const height = Math.sqrt(
    Math.max(0, firstLength * firstLength - alongDistance * alongDistance),
  );
  const unit = scaleVector(rootToEndpoint, 1 / endpointDistance);
  const base = add(root, scaleVector(unit, alongDistance));
  const perpendicular = rotate90(unit, bendDirection);

  return {
    joint: add(base, scaleVector(perpendicular, height)),
    endpoint,
  };
}

export function createDefaultSkeletonPose(
  model: SkeletonBodyModel,
  viewportWidth: number,
  viewportHeight: number,
): SkeletonPose {
  const center = { x: viewportWidth / 2, y: viewportHeight / 2 };
  const torso = { x: center.x, y: center.y - model.torsoToPelvis * 0.35 };
  const pelvis = { x: center.x, y: torso.y + model.torsoToPelvis };
  const neck = { x: center.x, y: torso.y - model.neckToTorso };
  const leftShoulder = { x: neck.x - model.shoulderWidth / 2, y: neck.y + 8 };
  const rightShoulder = { x: neck.x + model.shoulderWidth / 2, y: neck.y + 8 };
  const leftHip = { x: pelvis.x - model.hipWidth / 2, y: pelvis.y };
  const rightHip = { x: pelvis.x + model.hipWidth / 2, y: pelvis.y };

  const leftArm = solveTwoBoneJoint(
    leftShoulder,
    { x: leftShoulder.x - model.upperArm * 0.75, y: leftShoulder.y + model.forearm },
    model.upperArm,
    model.forearm,
    -1,
  );
  const rightArm = solveTwoBoneJoint(
    rightShoulder,
    { x: rightShoulder.x + model.upperArm * 0.75, y: rightShoulder.y + model.forearm },
    model.upperArm,
    model.forearm,
    1,
  );
  const leftLeg = solveTwoBoneJoint(
    leftHip,
    { x: leftHip.x - model.thigh * 0.35, y: leftHip.y + model.thigh + model.shin * 0.82 },
    model.thigh,
    model.shin,
    1,
  );
  const rightLeg = solveTwoBoneJoint(
    rightHip,
    { x: rightHip.x + model.thigh * 0.35, y: rightHip.y + model.thigh + model.shin * 0.82 },
    model.thigh,
    model.shin,
    -1,
  );

  return {
    joints: {
      head: { x: neck.x, y: neck.y - model.headRadius * 1.55 },
      neck,
      torso,
      pelvis,
      leftShoulder,
      rightShoulder,
      leftElbow: leftArm.joint,
      rightElbow: rightArm.joint,
      leftHand: leftArm.endpoint,
      rightHand: rightArm.endpoint,
      leftHip,
      rightHip,
      leftKnee: leftLeg.joint,
      rightKnee: rightLeg.joint,
      leftFoot: leftLeg.endpoint,
      rightFoot: rightLeg.endpoint,
    },
  };
}
```

- [ ] **Step 2: Implement drag resolution**

Append this to `src/lib/skeletonPoseSolver.ts`:

```ts
function endpointRootId(endpointId: SkeletonEndpointId) {
  switch (endpointId) {
    case "leftHand":
      return "leftShoulder";
    case "rightHand":
      return "rightShoulder";
    case "leftFoot":
      return "leftHip";
    case "rightFoot":
      return "rightHip";
  }
}

function endpointJointId(endpointId: SkeletonEndpointId) {
  switch (endpointId) {
    case "leftHand":
      return "leftElbow";
    case "rightHand":
      return "rightElbow";
    case "leftFoot":
      return "leftKnee";
    case "rightFoot":
      return "rightKnee";
  }
}

function limbLengths(model: SkeletonBodyModel, endpointId: SkeletonEndpointId) {
  if (endpointId === "leftHand" || endpointId === "rightHand") {
    return { first: model.upperArm, second: model.forearm };
  }

  return { first: model.thigh, second: model.shin };
}

function bendDirection(endpointId: SkeletonEndpointId): 1 | -1 {
  switch (endpointId) {
    case "leftHand":
      return -1;
    case "rightHand":
      return 1;
    case "leftFoot":
      return 1;
    case "rightFoot":
      return -1;
  }
}

function shiftCore(
  joints: SkeletonJointMap,
  delta: SimulationPoint,
): SkeletonJointMap {
  const shifted = { ...joints };
  const coreIds = [
    "head",
    "neck",
    "torso",
    "pelvis",
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
  ] as const;

  coreIds.forEach((jointId) => {
    shifted[jointId] = add(shifted[jointId], delta);
  });

  return shifted;
}

function resolveRestingLimbs(
  joints: SkeletonJointMap,
  model: SkeletonBodyModel,
  draggedEndpointId: SkeletonEndpointId,
): SkeletonJointMap {
  const resolved = { ...joints };
  const endpoints: SkeletonEndpointId[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];

  endpoints.forEach((endpointId) => {
    if (endpointId === draggedEndpointId) {
      return;
    }

    const rootId = endpointRootId(endpointId);
    const jointId = endpointJointId(endpointId);
    const lengths = limbLengths(model, endpointId);
    const solved = solveTwoBoneJoint(
      resolved[rootId],
      resolved[endpointId],
      lengths.first,
      lengths.second,
      bendDirection(endpointId),
    );

    resolved[jointId] = solved.joint;
    resolved[endpointId] = solved.endpoint;
  });

  return resolved;
}

export function resolveSkeletonPoseDrag(
  pose: SkeletonPose,
  input: SkeletonDragInput,
  model: SkeletonBodyModel,
): SkeletonPose {
  const rootId = endpointRootId(input.endpointId);
  const jointId = endpointJointId(input.endpointId);
  const lengths = limbLengths(model, input.endpointId);
  const maxReach = lengths.first + lengths.second;
  const root = pose.joints[rootId];
  const targetDistance = distance(root, input.target);
  const overflow = Math.max(0, targetDistance - maxReach * 0.82);
  const coreShift =
    targetDistance > 0
      ? scaleVector(
          subtract(input.target, root),
          (overflow / targetDistance) * TORSO_FOLLOW_RATIO,
        )
      : { x: 0, y: 0 };
  const shiftedJoints = shiftCore(pose.joints, coreShift);
  const solved = solveTwoBoneJoint(
    shiftedJoints[rootId],
    input.target,
    lengths.first,
    lengths.second,
    bendDirection(input.endpointId),
  );
  const nextJoints: SkeletonJointMap = {
    ...shiftedJoints,
    [jointId]: solved.joint,
    [input.endpointId]: solved.endpoint,
  };

  return {
    joints: resolveRestingLimbs(nextJoints, model, input.endpointId),
  };
}

export function getEndpointPosition(
  pose: SkeletonPose,
  endpointId: SkeletonEndpointId,
): SimulationPoint {
  return pose.joints[endpointId];
}

export function getSkeletonCenter(pose: SkeletonPose): SimulationPoint {
  return midpoint(pose.joints.torso, pose.joints.pelvis);
}
```

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors from src/lib/skeletonPoseSolver.ts.
```

- [ ] **Step 4: Review solver behavior in code**

Check these invariants manually in the code before moving on:

- `resolveSkeletonPoseDrag` never mutates `pose.joints` in place.
- `solveTwoBoneJoint` clamps endpoints to `firstLength + secondLength`.
- Core shift only applies to core joints, not every limb endpoint.
- Resting limbs are re-solved after core shift so their segment lengths remain bounded.

- [ ] **Step 5: Diff checkpoint**

Run:

```bash
git diff -- src/lib/skeletonPoseSolver.ts
```

Expected: pure TypeScript module with no React Native imports.

---

## Task 4: Build the Skeleton Overlay UI

**Files:**
- Create: `src/components/SkeletonPoseOverlay.tsx`
- Read: `src/store/useBodyProfileStore.ts`
- Read: `src/lib/bodyModel.ts`
- Read: `src/lib/skeletonPoseSolver.ts`

- [ ] **Step 1: Add overlay component shell and rendering**

Create `src/components/SkeletonPoseOverlay.tsx` with this structure:

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import {
  createSkeletonBodyModel,
  DEFAULT_SKELETON_SCALE,
  MAX_SKELETON_SCALE,
  MIN_SKELETON_SCALE,
  SKELETON_SCALE_STEP,
  clampSkeletonScale,
} from "../lib/bodyModel";
import {
  createDefaultSkeletonPose,
  getEndpointPosition,
  resolveSkeletonPoseDrag,
} from "../lib/skeletonPoseSolver";
import { useBodyProfileStore } from "../store/useBodyProfileStore";
import type { SimulationPoint } from "../types/simulation";
import type {
  SkeletonEndpointId,
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

function getNearestEndpoint(
  pose: SkeletonPose,
  point: SimulationPoint,
): SkeletonEndpointId | null {
  const hitRadius = 34;
  const nearest = ENDPOINTS.reduce<{
    id: SkeletonEndpointId;
    distanceSquared: number;
  } | null>((currentNearest, endpointId) => {
    const endpoint = getEndpointPosition(pose, endpointId);
    const dx = endpoint.x - point.x;
    const dy = endpoint.y - point.y;
    const distanceSquared = dx * dx + dy * dy;

    if (!currentNearest || distanceSquared < currentNearest.distanceSquared) {
      return { id: endpointId, distanceSquared };
    }

    return currentNearest;
  }, null);

  if (!nearest || nearest.distanceSquared > hitRadius * hitRadius) {
    return null;
  }

  return nearest.id;
}

function formatScale(scale: number) {
  return `${Math.round(scale * 100)}%`;
}

export function SkeletonPoseOverlay({
  viewportHeight,
  viewportWidth,
}: SkeletonPoseOverlayProps) {
  const { profile } = useBodyProfileStore();
  const [scale, setScale] = useState(DEFAULT_SKELETON_SCALE);
  const bodyModel = useMemo(
    () => createSkeletonBodyModel(profile, scale),
    [profile, scale],
  );
  const [pose, setPose] = useState<SkeletonPose>(() =>
    createDefaultSkeletonPose(bodyModel, viewportWidth, viewportHeight),
  );
  const [activeEndpointId, setActiveEndpointId] =
    useState<SkeletonEndpointId | null>(null);

  useEffect(() => {
    setPose(createDefaultSkeletonPose(bodyModel, viewportWidth, viewportHeight));
  }, [bodyModel, viewportHeight, viewportWidth]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) =>
          getNearestEndpoint(pose, {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          }) !== null,
        onMoveShouldSetPanResponder: () => activeEndpointId !== null,
        onPanResponderGrant: (event) => {
          const endpointId = getNearestEndpoint(pose, {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          });
          setActiveEndpointId(endpointId);
        },
        onPanResponderMove: (event) => {
          const endpointId = activeEndpointId;

          if (!endpointId) {
            return;
          }

          setPose((currentPose) =>
            resolveSkeletonPoseDrag(
              currentPose,
              {
                endpointId,
                target: {
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                },
              },
              bodyModel,
            ),
          );
        },
        onPanResponderRelease: () => setActiveEndpointId(null),
        onPanResponderTerminate: () => setActiveEndpointId(null),
      }),
    [activeEndpointId, bodyModel, pose],
  );

  function resetPose() {
    setPose(createDefaultSkeletonPose(bodyModel, viewportWidth, viewportHeight));
  }

  function nudgeScale(direction: 1 | -1) {
    setScale((currentScale) =>
      clampSkeletonScale(currentScale + SKELETON_SCALE_STEP * direction),
    );
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View {...panResponder.panHandlers} style={styles.skeletonTouchLayer}>
        <Svg height="100%" width="100%">
          {BONES.map(([from, to]) => (
            <Line
              key={`${from}-${to}`}
              stroke="rgba(255,255,255,0.78)"
              strokeLinecap="round"
              strokeWidth={5}
              x1={pose.joints[from].x}
              x2={pose.joints[to].x}
              y1={pose.joints[from].y}
              y2={pose.joints[to].y}
            />
          ))}

          <Circle
            cx={pose.joints.head.x}
            cy={pose.joints.head.y}
            fill="rgba(255,255,255,0.1)"
            r={bodyModel.headRadius}
            stroke="rgba(255,255,255,0.78)"
            strokeWidth={4}
          />

          {ENDPOINTS.map((endpointId) => {
            const point = pose.joints[endpointId];
            const isActive = endpointId === activeEndpointId;

            return (
              <Circle
                key={endpointId}
                cx={point.x}
                cy={point.y}
                fill={isActive ? "#ffb37a" : "rgba(255,255,255,0.9)"}
                r={isActive ? 13 : 10}
                stroke="rgba(15,15,15,0.9)"
                strokeWidth={3}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="스켈레톤 축소"
          onPress={() => nudgeScale(-1)}
          style={styles.iconButton}
        >
          <Ionicons color="#ffffff" name="remove" size={18} />
        </Pressable>

        <Text style={styles.scaleLabel}>{formatScale(scale)}</Text>

        <Pressable
          accessibilityLabel="스켈레톤 확대"
          onPress={() => nudgeScale(1)}
          style={styles.iconButton}
        >
          <Ionicons color="#ffffff" name="add" size={18} />
        </Pressable>

        <Pressable
          accessibilityLabel="스켈레톤 초기화"
          onPress={resetPose}
          style={styles.iconButton}
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
  skeletonTouchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: "absolute",
    left: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(10,10,10,0.5)",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  scaleLabel: {
    minWidth: 46,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
```

- [ ] **Step 2: Fix stale active endpoint behavior if observed**

If the first run shows drag movement only after a second touch, replace the `activeEndpointId` state read in `onPanResponderMove` with a ref:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
```

```tsx
const activeEndpointIdRef = useRef<SkeletonEndpointId | null>(null);
```

Set both state and ref together:

```tsx
function setActiveEndpoint(endpointId: SkeletonEndpointId | null) {
  activeEndpointIdRef.current = endpointId;
  setActiveEndpointId(endpointId);
}
```

Then in the responder:

```tsx
onPanResponderGrant: (event) => {
  const endpointId = getNearestEndpoint(pose, {
    x: event.nativeEvent.locationX,
    y: event.nativeEvent.locationY,
  });
  setActiveEndpoint(endpointId);
},
onPanResponderMove: (event) => {
  const endpointId = activeEndpointIdRef.current;

  if (!endpointId) {
    return;
  }

  setPose((currentPose) =>
    resolveSkeletonPoseDrag(
      currentPose,
      {
        endpointId,
        target: {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        },
      },
      bodyModel,
    ),
  );
},
onPanResponderRelease: () => setActiveEndpoint(null),
onPanResponderTerminate: () => setActiveEndpoint(null),
```

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors from SkeletonPoseOverlay imports, props, or SVG usage.
```

- [ ] **Step 4: Diff checkpoint**

Run:

```bash
git diff -- src/components/SkeletonPoseOverlay.tsx
```

Expected: overlay is self-contained and does not edit route detection behavior.

---

## Task 5: Mount the Overlay in the Simulation Canvas

**Files:**
- Modify: `src/components/SimulationCanvasStage.tsx`
- Read: `src/components/RouteHighlightOverlay.tsx`
- Read: `src/components/SimulationPhotoViewport.tsx`

- [ ] **Step 1: Import the overlay**

In `src/components/SimulationCanvasStage.tsx`, add:

```ts
import { SkeletonPoseOverlay } from "./SkeletonPoseOverlay";
```

- [ ] **Step 2: Mount the overlay after route highlights**

In the canvas area, immediately after the `RouteHighlightOverlay` block and before the full-screen `Pressable`, add:

```tsx
{viewport.width > 0 && viewport.height > 0 ? (
  <SkeletonPoseOverlay
    viewportHeight={viewport.height}
    viewportWidth={viewport.width}
  />
) : null}
```

- [ ] **Step 3: Prevent the route-selection Pressable from stealing skeleton drags**

If skeleton handles do not receive touches because the existing full-screen `Pressable` sits above them, change the route-selection layer from always-active to only active when the user taps outside skeleton handles. The lowest-risk first fix is to mount `SkeletonPoseOverlay` after the route-selection `Pressable` but before `canvasTopOverlay`.

Use this order in `SimulationCanvasStage.tsx`:

1. Render `SimulationPhotoViewport`.
2. Render `RouteHighlightOverlay` when `analysisResult` exists.
3. Render the existing full-screen route-selection `Pressable` and its info card.
4. Render `SkeletonPoseOverlay` with the current `viewportHeight` and `viewportWidth`.
5. Render the existing `canvasTopOverlay` with camera, library, and delete buttons.

Expected behavior:

- Skeleton drag handles receive drag touches.
- Top camera/library/delete buttons still receive touches.
- The route-selection info card remains visible.

- [ ] **Step 4: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors in SimulationCanvasStage integration.
```

- [ ] **Step 5: Diff checkpoint**

Run:

```bash
git diff -- src/components/SimulationCanvasStage.tsx src/components/SkeletonPoseOverlay.tsx
```

Expected: `SimulationCanvasStage.tsx` only imports and mounts the overlay.

---

## Task 6: Polish Touch Behavior and Korean UI Copy

**Files:**
- Modify: `src/components/SkeletonPoseOverlay.tsx`

- [ ] **Step 1: Keep controls out of the top utility buttons**

If `SkeletonPoseOverlay` controls overlap the camera/library/delete buttons, move controls to the lower-left area above the info card:

```ts
controls: {
  position: "absolute",
  left: 14,
  bottom: 118,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 8,
  paddingVertical: 8,
  borderRadius: 18,
  backgroundColor: "rgba(10,10,10,0.5)",
},
```

- [ ] **Step 2: Use concise Korean labels for accessibility**

Ensure these labels exist:

```tsx
accessibilityLabel="스켈레톤 축소"
accessibilityLabel="스켈레톤 확대"
accessibilityLabel="스켈레톤 초기화"
```

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors after UI polish.
```

- [ ] **Step 4: Diff checkpoint**

Run:

```bash
git diff -- src/components/SkeletonPoseOverlay.tsx
```

Expected: only layout/copy changes from this task.

---

## Task 7: Manual Verification

**Files:**
- Read: all files changed by Tasks 1-6

- [ ] **Step 1: Run static verification**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors.
```

- [ ] **Step 2: Start the Expo dev client**

Run:

```bash
npx expo start --dev-client --host lan
```

Expected:

```text
Expo starts and prints a LAN URL/QR code.
```

- [ ] **Step 3: Verify on device or simulator**

Manual checks:

- Open the simulation tab.
- Add or select a photo.
- Confirm the skeleton appears over the photo before relying on hold detection.
- Drag left hand, right hand, left foot, and right foot.
- Confirm arms and legs bend instead of stretching.
- Drag a hand far from its shoulder and confirm torso/shoulders shift toward the target.
- Drag a foot far from its hip and confirm pelvis/hips shift toward the target.
- Press `+` and confirm the skeleton grows.
- Press `-` and confirm the skeleton shrinks.
- Press reset and confirm the skeleton returns to the default centered pose.
- Confirm camera/library/delete buttons still work.
- Confirm route selection remains usable when tapping outside skeleton handles.

- [ ] **Step 4: Final diff review**

Run:

```bash
git diff -- src/types/skeletonPose.ts src/lib/bodyModel.ts src/lib/skeletonPoseSolver.ts src/components/SkeletonPoseOverlay.tsx src/components/SimulationCanvasStage.tsx
```

Expected:

- No Nest API or vision-service changes from this feature.
- No `.superpowers/brainstorm/` files staged or committed.
- No private images added.
- No dependency changes in `package.json`.

---

## Known Follow-Ups Outside MVP

- Add a test runner for pure solver unit tests if the project adopts one.
- Persist skeleton pose/scale in `useSimulationStore` if users expect pose state to survive tab changes.
- Add hold snapping after route detection returns stable hold centers.
- Add wall-scale calibration using user-confirmed reach from a start hold.
- Evaluate physics-assisted contact/falling behavior after the pose editor feels predictable.
