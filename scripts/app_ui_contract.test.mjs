import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSource = new URL("../app/index.tsx", import.meta.url);
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
const homeGlassCardSource = new URL(
  "../src/components/HomeGlassCard.tsx",
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

test("home glass card uses the exported Rupa logo image", async () => {
  const source = await readFile(homeGlassCardSource, "utf8");

  assert.match(source, /Image/);
  assert.match(source, /assets\/rupa-logo\.png/);
  assert.doesNotMatch(source, /<Text style=\{styles\.brand\}/);
  assert.doesNotMatch(source, /logoPlate/);
  assert.match(source, /logoImage/);
  assert.match(source, /width: 178/);
  assert.match(source, /height: 74/);
  assert.match(source, /fontSize: 32/);
  assert.match(source, /minHeight: 430/);
});

test("tab screens remove the decorative app header", async () => {
  const settings = await readFile(settingsSource, "utf8");
  const simulationInput = await readFile(simulationInputSource, "utf8");
  const simulationCanvas = await readFile(simulationCanvasSource, "utf8");

  assert.doesNotMatch(settings, /AppHeader/);
  assert.doesNotMatch(simulationInput, /AppHeader/);
  assert.doesNotMatch(simulationCanvas, /AppHeader/);
  assert.match(simulationInput, /backgroundColor: brand\.colors\.wall/);
  assert.match(settings, /backgroundColor: brand\.colors\.wall/);
  assert.match(simulationCanvas, /backgroundColor: brand\.colors\.wall/);
});

test("simulation start screen balances primary action with body context", async () => {
  const source = await readFile(simulationInputSource, "utf8");

  assert.match(source, /useBodyProfileStore/);
  assert.match(source, /새 시뮬레이션/);
  assert.match(source, /현재 신체 정보/);
  assert.match(source, /router\.push\("\/\(tabs\)\/settings"\)/);
  assert.match(source, /hasBodyProfile/);
  assert.match(source, /신체 정보 입력 필요/);
  assert.match(source, /먼저 입력해 주세요/);
  assert.match(source, /styles\.profileStripRequired/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /profile\.height/);
  assert.match(source, /profile\.wingspan/);
  assert.match(source, /styles\.profileStrip/);
  assert.doesNotMatch(source, /직접 입력/);
  assert.match(source, /minHeight: 300/);
  assert.doesNotMatch(source, /minHeight: 360/);
});

test("settings screen keeps the profile form visually organized", async () => {
  const source = await readFile(settingsSource, "utf8");

  assert.match(source, /hasBodyProfile/);
  assert.match(source, /hasBodyProfile \? toDisplayNumber\(profile\.height\) : "0"/);
  assert.match(source, /hasBodyProfile \? toDisplayNumber\(profile\.wingspan\) : "0"/);
  assert.match(source, /function toNumericInput/);
  assert.match(source, /text\.replace\(\/\\D\+\/g, ""\)/);
  assert.match(source, /const nextText = toNumericInput\(text\)/);
  assert.doesNotMatch(source, /placeholder=/);
  assert.doesNotMatch(source, /placeholderTextColor/);
  assert.doesNotMatch(source, /키 기준으로 자동 계산돼요/);
  assert.doesNotMatch(source, /키를 입력하면 자동 계산돼요/);
  assert.match(source, /styles\.introPanel/);
  assert.match(source, /styles\.introIcon/);
  assert.match(source, /backgroundColor: "rgba\(255, 248, 231, 0\.9\)"/);
  assert.match(source, /borderColor: "rgba\(37, 29, 21, 0\.1\)"/);
});

test("bottom tab bar stays compact and avoids the blue accent palette", async () => {
  const source = await readFile(bottomTabBarSource, "utf8");

  assert.doesNotMatch(source, /useSafeAreaInsets/);
  assert.doesNotMatch(source, /insets\.bottom/);
  assert.doesNotMatch(source, /accentSoft/);
  assert.match(source, /tabActive/);
  assert.doesNotMatch(source, /activeMarker/);
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
