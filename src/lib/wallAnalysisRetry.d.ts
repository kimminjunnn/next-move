import type { WallAnalysisResult } from "../types/simulation";

export type WallAnalysisRetryState = {
  analysisResult: WallAnalysisResult | null;
  flowStep: string;
  highlightError: string | null;
};

export function shouldShowWallAnalysisRetry(
  state: WallAnalysisRetryState,
): boolean;

export function shouldShowWallAnalysisFallbackStart(
  state: WallAnalysisRetryState,
): boolean;
