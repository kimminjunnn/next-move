# Rupa Rigged Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for development work by default, as required by `AGENTS.md`. Keep TDD checkpoints for implementation steps. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a raster-part Rupa monkey character that follows the existing skeleton pose rig.

**Architecture:** Keep the current skeleton solver and gesture layer as the control rig. Add a typed render rig that maps joint pairs to transparent image parts, then mount the character layer inside `SkeletonPoseOverlay` with `pointerEvents="none"`.

**Tech Stack:** Expo React Native, TypeScript, React Native `Image`, existing `react-native-svg` skeleton controls, Node test runner for pure rig math.

---

## File Structure

- Create: `src/types/characterRig.ts`
  - Owns rig part ids, metadata, joint anchors, pivot data, and computed transform types.
- Create: `src/lib/rupaCharacterRig.ts`
  - Owns the back-view manifest and pure geometry helpers for rotation, scale, center, and part sizing.
- Create: `src/lib/rupaCharacterRig.test.js`
  - Tests rig transform behavior before production code changes.
- Create: `src/components/RiggedImagePart.tsx`
  - Renders one transformed image part.
- Create: `src/components/RupaCharacterLayer.tsx`
  - Renders all character parts in z-order.
- Modify: `src/components/SkeletonPoseOverlay.tsx`
  - Mounts the character layer and keeps existing skeleton controls.
- Create: `assets/rupa_theme/character/back/*.png`
  - First-pass transparent raster parts for the back-view Rupa character.
- Optional modify: `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`
  - Record asset prompt/source notes after asset creation.

## Task 1: Rig Types And Transform Tests

**Files:**

- Create: `src/types/characterRig.ts`
- Create: `src/lib/rupaCharacterRig.test.js`

- [ ] **Step 1: Write the failing transform tests**

Create `src/lib/rupaCharacterRig.test.js` with tests for these behaviors:

- a limb part from `{ x: 10, y: 20 }` to `{ x: 10, y: 70 }` has a 90 degree rotation and length 50
- a part using `lengthScale: 1.2` renders 60 pixels long for a 50 pixel joint distance
- static pelvis parts can use an offset from a single anchor joint
- z-order sorting is stable from low to high

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
node --test src/lib/rupaCharacterRig.test.js
```

Expected: FAIL because `src/lib/rupaCharacterRig.ts` does not exist yet.

- [ ] **Step 3: Add `src/types/characterRig.ts`**

Define:

- `CharacterRigPartId`
- `CharacterRigJointAnchor`
- `CharacterRigLimbPart`
- `CharacterRigAnchorPart`
- `CharacterRigPart`
- `ComputedCharacterPartTransform`

Use `SkeletonPointName` for skeleton joint references.

## Task 2: Rig Transform Helpers

**Files:**

- Create: `src/lib/rupaCharacterRig.ts`
- Test: `src/lib/rupaCharacterRig.test.js`

- [ ] **Step 1: Implement the minimal pure helpers**

Add helpers for:

- `getPointDistance`
- `getRotationDegrees`
- `computeLimbPartTransform`
- `computeAnchorPartTransform`
- `sortRigPartsByZIndex`

The helpers should not import React or React Native.

- [ ] **Step 2: Run the focused test and confirm GREEN**

Run:

```bash
node --test src/lib/rupaCharacterRig.test.js
```

Expected: PASS.

- [ ] **Step 3: Refactor only after green**

Keep the helper names explicit and leave comments only for pivot or transform math that is not obvious.

## Task 3: First-Pass Back-View Assets

**Files:**

- Create: `assets/rupa_theme/character/back/`
- Create: transparent PNG files listed in the design spec

- [ ] **Step 1: Generate or prepare part assets**

Use `assets/rupa_theme/references/theme1.png` as the style reference. Produce separate transparent PNG parts with generous padding and no shadows.

The first pass can be imperfect, but each part must have enough transparent padding for rotation without clipping.

- [ ] **Step 2: Inspect asset dimensions**

Run:

```bash
file assets/rupa_theme/character/back/*.png
```

Expected: every required part is a PNG image with alpha or a transparent-ready format accepted by Expo.

- [ ] **Step 3: Record source notes**

Append a short note to the design spec describing how the first-pass assets were produced.

## Task 4: Static Rupa Back Rig Manifest

**Files:**

- Modify: `src/lib/rupaCharacterRig.ts`
- Read: `src/types/skeletonPose.ts`

- [ ] **Step 1: Add explicit static requires**

Add a `RUPA_BACK_CHARACTER_PARTS` manifest with one entry per asset. Use explicit `require("../../assets/rupa_theme/character/back/<part>.png")` calls.

- [ ] **Step 2: Map limbs to joint pairs**

Map:

- upper arms: shoulder to elbow
- forearms: elbow to hand
- thighs: hip to knee
- shins: knee to foot

- [ ] **Step 3: Map anchored parts**

Map:

- head and ears near `head`
- torso near the midpoint of `neck`, `torso`, and `pelvis`
- tail near `pelvis`
- chalk bag near `pelvis`
- hands and feet near endpoint joints

- [ ] **Step 4: Type-check the manifest**

Run:

```bash
npx tsc --noEmit
```

Expected: no missing asset module errors and no type errors.

## Task 5: Image Part Renderer

**Files:**

- Create: `src/components/RiggedImagePart.tsx`

- [ ] **Step 1: Write the component**

The component receives:

- `source`
- `width`
- `height`
- `center`
- `rotationDeg`
- `opacity`
- `zIndex`

It renders an absolutely positioned `Image` with transform order:

1. translate to center
2. rotate
3. no gesture handling

- [ ] **Step 2: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

## Task 6: Character Layer

**Files:**

- Create: `src/components/RupaCharacterLayer.tsx`
- Modify: `src/lib/rupaCharacterRig.ts`

- [ ] **Step 1: Build computed part list**

Add a function that receives `pose` and `bodyModel`, computes all part transforms, and returns sorted parts.

- [ ] **Step 2: Render all parts**

`RupaCharacterLayer` maps computed parts to `RiggedImagePart`.

The top-level layer must use:

```tsx
<View pointerEvents="none" style={StyleSheet.absoluteFill}>
```

- [ ] **Step 3: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

## Task 7: Skeleton Overlay Integration

**Files:**

- Modify: `src/components/SkeletonPoseOverlay.tsx`

- [ ] **Step 1: Mount the character layer**

Render `RupaCharacterLayer` inside the existing overlay, before the skeleton control SVG. The character should appear when `mode === "simulating"`.

- [ ] **Step 2: Preserve controls**

Keep existing hit areas unchanged. During simulating mode, keep endpoint and joint controls visible enough for dragging. During sizing mode, keep the original skeleton read clear.

- [ ] **Step 3: Run type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

## Task 8: Review And Compound

**Files:**

- Modify as needed from review findings
- Optional modify: `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`

- [ ] **Step 1: Manual review**

Use skeleton lab to check:

- hands follow hand parts
- elbows and knees do not detach visually
- body drag moves all parts
- head drag keeps the head readable
- tail and chalk bag do not cover controls

- [ ] **Step 2: Simulation review**

Use the simulation flow to confirm:

- character does not block touches
- route highlight remains readable
- sizing mode still works

- [ ] **Step 3: Compound notes**

Record any reusable pivot, z-order, or asset-generation lessons in the design spec.
