# Rupa Friendly UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the app's visual atmosphere to a plywood climbing-wall Rupa theme without changing screen structure, copy, navigation, or behavior.

**Architecture:** Centralize the new gym-wall palette in `src/theme/brand.ts`, add a reusable decorative wall texture component, and wire existing screens/components to the new tokens. Keep all existing JSX content and workflow structure intact; only add non-interactive visual layers and style changes.

**Tech Stack:** Expo React Native, TypeScript, StyleSheet, existing image assets.

---

## File Structure

- Modify `src/theme/brand.ts`: replace minimal rebrand palette with plywood wall, hold, brown, gym gray, and danger tokens.
- Create `src/components/ClimbingWallTexture.tsx`: non-interactive absolute background layer with subtle screw-hole/T-nut dots.
- Modify `app/_layout.tsx`: set system/background colors to wall palette.
- Modify `app/index.tsx`: keep all copy and buttons, apply wall texture and yellow hold CTA.
- Modify `src/components/HomeGlassCard.tsx`: keep copy and layout, apply warm plywood-card colors.
- Modify `src/components/HomeHeroHolds.tsx`: keep decorative hold assets, tune opacity/placement colors indirectly through background compatibility only.
- Modify `src/components/SimulationBackground.tsx`: add wall texture behind existing decorative holds.
- Modify `src/components/AppHeader.tsx`, `src/components/BottomTabBar.tsx`, `src/components/ConfirmModal.tsx`: update shared surfaces and active/action colors.
- Modify `src/components/SimulationInputStage.tsx`, `app/(tabs)/settings.tsx`: update visual tokens only.
- Modify `src/components/SimulationCanvasStage.tsx`, `src/components/SimulationAdjustStage.tsx`, `src/components/RouteHighlightOverlay.tsx`, `src/components/SkeletonPoseOverlay.tsx`: replace old peach/red action accents with blue/yellow where they are not error/destructive states.
- Modify `app/skeleton-lab.tsx` only if old red/cream styling remains visually inconsistent.

## Task 1: Theme Tokens and Texture Component

**Files:**
- Modify: `src/theme/brand.ts`
- Create: `src/components/ClimbingWallTexture.tsx`

- [ ] **Step 1: Replace `brand.colors` with plywood wall tokens**

Use this exact shape:

```ts
export const brand = {
  name: "Rupa",
  colors: {
    wall: "#d7c49c",
    wallLight: "#f3e5bf",
    wallSpeck: "rgba(37, 29, 21, 0.28)",
    surface: "#fff4d7",
    surfaceWarm: "#ead4a7",
    text: "#251d15",
    mutedText: "#5f5549",
    border: "#c7ad7f",
    primary: "#e0b428",
    primaryPressed: "#c99718",
    primarySoft: "rgba(224, 180, 40, 0.2)",
    primaryText: "#251d15",
    accent: "#0b78a8",
    accentSoft: "#dceff0",
    accentPink: "#d54f8c",
    accentGreen: "#5f8f3c",
    gymGray: "#6b6258",
    gymDark: "#242321",
    danger: "#b33a35",
    dangerSoft: "#fff0ed",
    inactive: "#7b7064",
  },
} as const;
```

- [ ] **Step 2: Create `ClimbingWallTexture`**

Create a presentational component that renders only absolute-positioned dot views and never captures touches:

```tsx
import { StyleSheet, View } from "react-native";

import { brand } from "../theme/brand";

const DOTS = [
  { left: "8%", top: "8%" },
  { left: "22%", top: "12%" },
  { left: "39%", top: "7%" },
  { left: "56%", top: "13%" },
  { left: "74%", top: "8%" },
  { left: "91%", top: "15%" },
  { left: "13%", top: "27%" },
  { left: "31%", top: "24%" },
  { left: "48%", top: "29%" },
  { left: "66%", top: "23%" },
  { left: "84%", top: "31%" },
  { left: "7%", top: "45%" },
  { left: "25%", top: "50%" },
  { left: "44%", top: "43%" },
  { left: "62%", top: "49%" },
  { left: "80%", top: "44%" },
  { left: "95%", top: "53%" },
  { left: "16%", top: "67%" },
  { left: "36%", top: "72%" },
  { left: "54%", top: "65%" },
  { left: "72%", top: "70%" },
  { left: "88%", top: "64%" },
  { left: "10%", top: "86%" },
  { left: "29%", top: "82%" },
  { left: "51%", top: "90%" },
  { left: "69%", top: "84%" },
  { left: "92%", top: "88%" },
] as const;

export function ClimbingWallTexture() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((dot, index) => (
        <View
          key={`${dot.left}-${dot.top}-${index}`}
          style={[styles.dot, dot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: brand.colors.wallSpeck,
  },
});
```

## Task 2: Shared Shell and Home Visuals

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/index.tsx`
- Modify: `src/components/HomeGlassCard.tsx`
- Modify: `src/components/HomeHeroHolds.tsx`

- [ ] **Step 1: Update layout system background**

Use `brand.colors.wall` in `app/_layout.tsx` for `SystemUI.setBackgroundColorAsync` and stack background. Import `brand` without changing screen registration.

- [ ] **Step 2: Add wall texture to home without changing content**

In `app/index.tsx`, render `<ClimbingWallTexture />` inside the existing screen before decorative holds. Keep all current text, button labels, and navigation targets unchanged.

- [ ] **Step 3: Restyle home CTA**

Use:

```ts
backgroundColor: brand.colors.primary,
shadowColor: brand.colors.primary,
```

Use `brand.colors.primaryText` for CTA text and icon. Do not change `시작하기`.

- [ ] **Step 4: Restyle the secondary lab button**

Use `brand.colors.accentSoft`, `brand.colors.border`, and `brand.colors.text`. Do not change `스켈레톤 테스트`.

- [ ] **Step 5: Restyle `HomeGlassCard` only through color/surface values**

Keep its current copy and layout. Use `brand.colors.surface`, `brand.colors.text`, `brand.colors.mutedText`, and warm border/shadow colors.

## Task 3: Shared Navigation and Cards

**Files:**
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/BottomTabBar.tsx`
- Modify: `src/components/SimulationBackground.tsx`
- Modify: `src/components/ConfirmModal.tsx`

- [ ] **Step 1: Update header**

Use wall/surface colors from `brand.colors`. Keep the menu alert text unchanged.

- [ ] **Step 2: Update tab bar**

Use `brand.colors.primary` for active tab icons/text, `brand.colors.inactive` for inactive, and `brand.colors.surfaceWarm` for active background. Keep labels unchanged.

- [ ] **Step 3: Add wall texture to simulation background**

Render `<ClimbingWallTexture />` behind existing decorative hold images. Keep existing hold image components and positions unless opacity needs minor tuning.

- [ ] **Step 4: Update confirm modal visual colors**

Use `brand.colors.surface`, `brand.colors.border`, `brand.colors.text`, `brand.colors.mutedText`, `brand.colors.danger`, and `brand.colors.primaryText`. Do not change modal titles, body text, labels, or callbacks.

## Task 4: Input and Settings Screens

**Files:**
- Modify: `src/components/SimulationInputStage.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace screen backgrounds with wall colors**

Use `brand.colors.wall` for safe area and screen backgrounds.

- [ ] **Step 2: Replace card, icon box, badge, and input surfaces**

Use `brand.colors.surface`, `brand.colors.surfaceWarm`, `brand.colors.accentSoft`, `brand.colors.border`, `brand.colors.text`, and `brand.colors.mutedText`. Preserve all text and JSX order.

- [ ] **Step 3: Replace settings primary action**

Use `brand.colors.primary`, `brand.colors.primaryPressed` if a pressed style exists, and `brand.colors.primaryText`. Keep button label and navigation unchanged.

- [ ] **Step 4: Preserve validation/error colors**

Use `brand.colors.danger` and `brand.colors.dangerSoft` for invalid input and error text.

## Task 5: Simulation Tool Accents

**Files:**
- Modify: `src/components/SimulationCanvasStage.tsx`
- Modify: `src/components/SimulationAdjustStage.tsx`
- Modify: `src/components/RouteHighlightOverlay.tsx`
- Modify: `src/components/SkeletonPoseOverlay.tsx`
- Modify: `app/skeleton-lab.tsx` if needed

- [ ] **Step 1: Preserve dark photo/canvas base**

Keep canvas/photo backgrounds dark where they protect photo readability.

- [ ] **Step 2: Replace old peach accents**

Replace non-error `#ffb37a`, `#ffddb7`, and `#ffc999` usages with `brand.colors.primary`, `brand.colors.accentSoft`, `brand.colors.accent`, or suitable alpha variants.

- [ ] **Step 3: Preserve destructive/error states**

Keep trash/delete/error states visually red only where destructive or failed analysis semantics apply. Prefer `brand.colors.danger`.

- [ ] **Step 4: Update skeleton lab only visually**

If `app/skeleton-lab.tsx` still uses old red as active/action color, switch it to `brand.colors.primary`. Do not change test controls, labels, or skeleton behavior.

## Task 6: Verification

**Files:**
- Read-only verification across changed files

- [ ] **Step 1: Type check**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 2: Search for old red/peach primary colors**

Run:

```bash
rg -n "#8f0000|#7a1f12|#ffb37a|#ffddb7|#ffc999" app src
```

Expected: no output for primary CTA, active tab, or non-error action states. Any remaining output must be destructive/error/canvas-specific and should be reviewed.

- [ ] **Step 3: Search for old brand text**

Run:

```bash
rg -n "Next Move|NEXT MOVE|nextmove|루파|next-move" app src docs/product.md package.json package-lock.json app.json
```

Expected: no output.

- [ ] **Step 4: Review diff scope**

Run:

```bash
git diff -- app src/components src/theme
```

Expected: visual style/token/background changes only. No copy changes, navigation target changes, route-detection API changes, or simulation behavior changes.
