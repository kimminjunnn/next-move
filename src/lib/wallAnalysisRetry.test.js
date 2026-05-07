const assert = require("node:assert/strict");
const test = require("node:test");

const { shouldShowWallAnalysisRetry } = require("./wallAnalysisRetry.js");

test("shows wall analysis retry only after analysis fails without a result", () => {
  assert.equal(
    shouldShowWallAnalysisRetry({
      analysisResult: null,
      flowStep: "selectingStartHold",
      highlightError: "벽 분석에 실패했어요.",
    }),
    true,
  );
});

test("hides wall analysis retry while analysis is still running", () => {
  assert.equal(
    shouldShowWallAnalysisRetry({
      analysisResult: null,
      flowStep: "analyzingHolds",
      highlightError: null,
    }),
    false,
  );
});

test("hides wall analysis retry after analysis returns objects", () => {
  assert.equal(
    shouldShowWallAnalysisRetry({
      analysisResult: { objects: [{ id: "hold-1" }] },
      flowStep: "selectingStartHold",
      highlightError: null,
    }),
    false,
  );
});
