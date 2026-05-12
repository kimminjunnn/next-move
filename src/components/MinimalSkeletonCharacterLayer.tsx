import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

import { getPoseHeadFacing } from "../lib/rupaCharacterRig";
import { getSkeletonCharacterVisualProfile } from "../lib/skeletonCharacterVisualProfile";
import type { SkeletonCharacterVisualProfile } from "../lib/skeletonCharacterVisualProfile";
import type { CharacterRigFacing } from "../types/characterRig";
import type { Point2D } from "../types/geometry";
import type {
  SkeletonBodyModel,
  SkeletonPointName,
  SkeletonPose,
} from "../types/skeletonPose";

export type MinimalSkeletonCharacterLayerProps = {
  activeControlId?: string | null;
  bodyModel: SkeletonBodyModel;
  opacity?: number;
  pose: SkeletonPose;
  renderStyle?:
    | "minimalSkeleton"
    | "stickmanCharacter"
    | "stickmanCharacterNavy"
    | "stickmanCharacterBlack";
  visible?: boolean;
};

type Bone = readonly [SkeletonPointName, SkeletonPointName];

const BODY_BONES: readonly Bone[] = [
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

const JOINTS: readonly SkeletonPointName[] = [
  "neck",
  "torso",
  "pelvis",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftHand",
  "rightHand",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftFoot",
  "rightFoot",
];

const STICKMAN_CHAINS: readonly (readonly SkeletonPointName[])[] = [
  ["neck", "torso", "pelvis"],
  ["neck", "leftShoulder", "leftElbow", "leftHand"],
  ["neck", "rightShoulder", "rightElbow", "rightHand"],
  ["pelvis", "leftHip", "leftKnee", "leftFoot"],
  ["pelvis", "rightHip", "rightKnee", "rightFoot"],
];

function getPointBetween(from: Point2D, to: Point2D, ratio: number): Point2D {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function isBoneActive(
  activeControlId: string | null | undefined,
  [from, to]: Bone,
) {
  return activeControlId === from || activeControlId === to;
}

function isChainActive(
  activeControlId: string | null | undefined,
  chain: readonly SkeletonPointName[],
) {
  return activeControlId ? chain.includes(activeControlId as SkeletonPointName) : false;
}

function getChainPath(pose: SkeletonPose, chain: readonly SkeletonPointName[]) {
  return chain
    .map((jointName, index) => {
      const point = pose.joints[jointName];

      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function getHeadRotationDegrees(pose: SkeletonPose) {
  const neck = pose.joints.neck;
  const head = pose.joints.head;

  return (Math.atan2(head.y - neck.y, head.x - neck.x) * 180) / Math.PI + 90;
}

function getFaceAnchor(
  center: Point2D,
  headRadius: number,
  facing: CharacterRigFacing,
) {
  const sideMultiplier = facing === "left" ? -1 : 1;

  return {
    eye: {
      x: center.x + sideMultiplier * headRadius * 0.22,
      y: center.y - headRadius * 0.16,
    },
    mouth: {
      x: center.x + sideMultiplier * headRadius * 0.22,
      y: center.y + headRadius * 0.23,
    },
    nose: {
      x: center.x + sideMultiplier * headRadius * 0.4,
      y: center.y + headRadius * 0.03,
    },
  };
}

function renderBackFace(
  center: Point2D,
  radius: number,
  metrics: SkeletonCharacterVisualProfile,
) {
  const top = {
    x: center.x,
    y: center.y - radius * 0.5,
  };
  const bottom = {
    x: center.x,
    y: center.y + radius * 0.48,
  };
  const controlX = center.x - radius * 0.12;

  return (
    <Path
      d={`M ${top.x} ${top.y} C ${controlX} ${center.y - radius * 0.16}, ${controlX} ${
        center.y + radius * 0.18
      }, ${bottom.x} ${bottom.y}`}
      fill="none"
      stroke={metrics.faceStrokeColor}
      strokeLinecap="round"
      strokeWidth={metrics.faceStrokeWidth}
    />
  );
}

function renderSideFace(
  center: Point2D,
  radius: number,
  facing: CharacterRigFacing,
  metrics: SkeletonCharacterVisualProfile,
) {
  const sideMultiplier = facing === "left" ? -1 : 1;
  const anchor = getFaceAnchor(center, radius, facing);
  const noseEnd = {
    x: anchor.nose.x + sideMultiplier * radius * 0.16,
    y: anchor.nose.y + radius * 0.04,
  };
  const mouthStart = {
    x: anchor.mouth.x - sideMultiplier * radius * 0.07,
    y: anchor.mouth.y,
  };
  const mouthEnd = {
    x: anchor.mouth.x + sideMultiplier * radius * metrics.mouthLengthRatio,
    y: anchor.mouth.y + radius * 0.02,
  };

  return (
    <>
      <Circle
        cx={anchor.eye.x}
        cy={anchor.eye.y}
        fill={metrics.faceStrokeColor}
        r={metrics.eyeRadius}
      />
      <Line
        stroke={metrics.faceStrokeColor}
        strokeLinecap="round"
        strokeWidth={metrics.faceStrokeWidth}
        x1={anchor.nose.x}
        x2={noseEnd.x}
        y1={anchor.nose.y}
        y2={noseEnd.y}
      />
      <Line
        stroke={metrics.faceStrokeColor}
        strokeLinecap="round"
        strokeWidth={metrics.faceStrokeWidth}
        x1={mouthStart.x}
        x2={mouthEnd.x}
        y1={mouthStart.y}
        y2={mouthEnd.y}
      />
    </>
  );
}

export function MinimalSkeletonCharacterLayer({
  activeControlId = null,
  bodyModel,
  opacity = 1,
  pose,
  renderStyle = "minimalSkeleton",
  visible = true,
}: MinimalSkeletonCharacterLayerProps) {
  const facing = useMemo(
    () => getPoseHeadFacing(pose, activeControlId),
    [activeControlId, pose],
  );
  const metrics = useMemo(
    () =>
      getSkeletonCharacterVisualProfile({
        headRadius: bodyModel.headRadius,
        renderStyle,
        scale: bodyModel.scale,
      }),
    [bodyModel.headRadius, bodyModel.scale, renderStyle],
  );
  const head = pose.joints.head;
  const neck = pose.joints.neck;
  const headRadius = bodyModel.headRadius * metrics.headRadiusMultiplier;
  const headCenter = getPointBetween(
    head,
    neck,
    metrics.headCenterTowardNeckRatio,
  );
  const headRotation = getHeadRotationDegrees(pose);
  const isHeadActive = activeControlId === "head";

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.layer, { opacity }]}>
      <Svg height="100%" pointerEvents="none" width="100%">
        {metrics.useContinuousLimbPaths
          ? STICKMAN_CHAINS.map((chain) => {
              const active = isChainActive(activeControlId, chain);
              const d = getChainPath(pose, chain);

              return (
                <G key={chain.join("-")}>
                  <Path
                    d={d}
                    fill="none"
                    stroke={metrics.shadowStrokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={
                      active
                        ? metrics.activeStrokeWidth + 2.2
                        : metrics.strokeWidth + 2
                    }
                  />
                  <Path
                    d={d}
                    fill="none"
                    stroke={metrics.bodyStrokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={
                      active ? metrics.activeStrokeWidth : metrics.strokeWidth
                    }
                  />
                </G>
              );
            })
          : BODY_BONES.map((bone) => {
              const [from, to] = bone;
              const active = isBoneActive(activeControlId, bone);

              return (
                <G key={`${from}-${to}`}>
                  <Line
                    stroke={metrics.shadowStrokeColor}
                    strokeLinecap="round"
                    strokeWidth={
                      active
                        ? metrics.activeStrokeWidth + 2.2
                        : metrics.strokeWidth + 2
                    }
                    x1={pose.joints[from].x}
                    x2={pose.joints[to].x}
                    y1={pose.joints[from].y}
                    y2={pose.joints[to].y}
                  />
                  <Line
                    stroke={metrics.bodyStrokeColor}
                    strokeLinecap="round"
                    strokeWidth={
                      active ? metrics.activeStrokeWidth : metrics.strokeWidth
                    }
                    x1={pose.joints[from].x}
                    x2={pose.joints[to].x}
                    y1={pose.joints[from].y}
                    y2={pose.joints[to].y}
                  />
                </G>
              );
            })}

        <Circle
          cx={headCenter.x}
          cy={headCenter.y}
          fill={metrics.headFillColor}
          r={headRadius}
          stroke={metrics.headStrokeColor}
          strokeWidth={metrics.headStrokeWidth}
        />
        {metrics.showFaceMarks ? (
          <G
            origin={`${headCenter.x}, ${headCenter.y}`}
            rotation={facing === "back" ? headRotation : 0}
          >
            {facing === "back"
              ? renderBackFace(headCenter, headRadius, metrics)
              : renderSideFace(headCenter, headRadius, facing, metrics)}
          </G>
        ) : null}

        {JOINTS.map((jointName) => {
          const joint = pose.joints[jointName];
          const active = activeControlId === jointName;

          if (!active && !metrics.showIdleJoints) {
            return null;
          }

          return (
            <Circle
              key={jointName}
              cx={joint.x}
              cy={joint.y}
              fill={metrics.jointFillColor}
              r={active ? metrics.activeJointRadius : metrics.jointRadius}
              stroke={metrics.shadowStrokeColor}
              strokeWidth={active ? 2.4 : 1.8}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
