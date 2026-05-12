import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const skeletonLabSource = new URL("../app/skeleton-lab.tsx", import.meta.url);

test("skeleton lab keeps sizing available without a mode switch", async () => {
  const source = await readFile(skeletonLabSource, "utf8");

  assert.doesNotMatch(source, />무빙</);
  assert.doesNotMatch(source, />크기 조정</);
  assert.doesNotMatch(source, /setMode\(/);
  assert.match(source, /allowEmptySpacePinchScale/);
  assert.match(source, /allowPinchScaleInSimulation/);
  assert.match(source, /mode="simulating"/);
});
