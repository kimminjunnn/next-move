import type { SkeletonPose } from "../types/skeletonPose";

export type SkeletonPoseSnapshot = {
  pose: SkeletonPose;
  scale: number;
};

export type SkeletonPoseHistory = {
  past: SkeletonPoseSnapshot[];
  future: SkeletonPoseSnapshot[];
};

export type SkeletonPoseHistoryResult = {
  history: SkeletonPoseHistory;
  snapshot: SkeletonPoseSnapshot | null;
};

export function createSkeletonPoseHistory(): SkeletonPoseHistory;

export function pushSkeletonPoseHistory(
  history: SkeletonPoseHistory,
  snapshot: SkeletonPoseSnapshot,
): SkeletonPoseHistory;

export function undoSkeletonPoseHistory(
  history: SkeletonPoseHistory,
  currentSnapshot: SkeletonPoseSnapshot,
): SkeletonPoseHistoryResult;

export function redoSkeletonPoseHistory(
  history: SkeletonPoseHistory,
  currentSnapshot: SkeletonPoseSnapshot,
): SkeletonPoseHistoryResult;
