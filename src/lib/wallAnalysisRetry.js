export function shouldShowWallAnalysisRetry({
  analysisResult,
  flowStep,
  highlightError,
}) {
  return Boolean(
    flowStep === "selectingStartHold" && !analysisResult && highlightError,
  );
}

export function shouldShowWallAnalysisFallbackStart(state) {
  return shouldShowWallAnalysisRetry(state);
}
