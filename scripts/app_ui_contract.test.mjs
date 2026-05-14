import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSource = new URL("../app/index.tsx", import.meta.url);
const appHeaderSource = new URL("../src/components/AppHeader.tsx", import.meta.url);
const bottomTabBarSource = new URL(
  "../src/components/BottomTabBar.tsx",
  import.meta.url,
);
const simulationCanvasSource = new URL(
  "../src/components/SimulationCanvasStage.tsx",
  import.meta.url,
);
const settingsSource = new URL("../app/(tabs)/settings.tsx", import.meta.url);
const simulationInputSource = new URL(
  "../src/components/SimulationInputStage.tsx",
  import.meta.url,
);

test("home screen keeps internal skeleton lab out of the user entry flow", async () => {
  const source = await readFile(homeSource, "utf8");

  assert.doesNotMatch(source, /skeleton-lab/);
  assert.doesNotMatch(source, /스켈레톤 테스트/);
});

test("home hero image extends behind top and bottom safe areas", async () => {
  const source = await readFile(homeSource, "utf8");
  const safeAreaBlock = source.match(/safeArea:\s*\{[^}]*\}/)?.[0] ?? "";

  assert.match(source, /<View style=\{styles\.screen\}>[\s\S]*<HomeHeroHolds \/>[\s\S]*<SafeAreaView/);
  assert.doesNotMatch(safeAreaBlock, /backgroundColor/);
});

test("app header does not expose a placeholder menu action", async () => {
  const source = await readFile(appHeaderSource, "utf8");

  assert.doesNotMatch(source, /Alert\.alert/);
  assert.doesNotMatch(source, /준비 중/);
  assert.doesNotMatch(source, /name="menu"/);
});

test("bottom tab bar stays compact and avoids the blue accent palette", async () => {
  const source = await readFile(bottomTabBarSource, "utf8");

  assert.doesNotMatch(source, /useSafeAreaInsets/);
  assert.doesNotMatch(source, /insets\.bottom/);
  assert.doesNotMatch(source, /accentSoft/);
  assert.match(source, /activeMarker/);
  assert.match(source, /paddingBottom: 12/);
});

test("simulation canvas icon actions are accessible and large enough to tap", async () => {
  const source = await readFile(simulationCanvasSource, "utf8");

  assert.match(source, /accessibilityLabel="새 벽 사진 촬영"/);
  assert.match(source, /accessibilityLabel="갤러리에서 벽 사진 선택"/);
  assert.match(source, /accessibilityLabel="현재 벽 사진 삭제"/);
  assert.match(source, /width: 44/);
  assert.match(source, /height: 44/);
});

test("settings screen presents body fields as the primary work surface", async () => {
  const source = await readFile(settingsSource, "utf8");

  assert.doesNotMatch(source, /styles\.heroCard/);
  assert.doesNotMatch(source, /BODY PROFILE/);
  assert.match(source, /styles\.introCopy/);
});

test("simulation and settings tab surfaces avoid blue accent blocks", async () => {
  const settings = await readFile(settingsSource, "utf8");
  const simulationInput = await readFile(simulationInputSource, "utf8");

  assert.doesNotMatch(settings, /brand\.colors\.accent/);
  assert.doesNotMatch(simulationInput, /brand\.colors\.accent/);
  assert.doesNotMatch(simulationInput, /rgba\(220, 239, 240/);
});
