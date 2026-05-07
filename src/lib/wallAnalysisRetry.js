export function shouldShowWallAnalysisRetry({
  analysisResult,
  flowStep,
  highlightError,
}) {
  return Boolean(
    flowStep === "selectingStartHold" && !analysisResult && highlightError,
  );
}
