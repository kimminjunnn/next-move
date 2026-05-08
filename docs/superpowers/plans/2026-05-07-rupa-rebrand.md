# Rupa Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app identity from Next Move to Rupa and apply the first-pass Rupa brand treatment without changing simulation behavior or API contracts.

**Architecture:** Keep the existing Expo app structure. Add a small shared brand theme module for brand strings, asset paths, and colors, then update app metadata, headers, home copy, tab colors, and product docs to use Rupa. Leave Nest API and vision-service contracts untouched.

**Tech Stack:** Expo React Native, TypeScript, Expo Router, existing static PNG assets, Markdown docs.

---

## File Structure

- Create `src/theme/brand.ts`: shared Rupa display name and color tokens for the Expo app.
- Modify `app.json`: Expo metadata, icon paths, splash/adaptive/favicon paths, and iOS bundle identifier.
- Modify `package.json` and `package-lock.json`: package identity from `next-move` to `rupa` if the lockfile root package mirrors the package name.
- Modify `app/index.tsx`: use brand colors for the first screen CTA/background.
- Modify `src/components/HomeGlassCard.tsx`: replace `NEXT MOVE` with `Rupa` and align text/color tokens.
- Modify `src/components/AppHeader.tsx`: use brand theme colors for header.
- Modify `src/components/BottomTabBar.tsx`: use brand theme colors for active/inactive states.
- Modify `src/components/SimulationInputStage.tsx`, `src/components/SimulationCanvasStage.tsx`, and `app/(tabs)/settings.tsx`: replace visible `Next Move` headers with `Rupa`.
- Modify `src/store/useBodyProfileStore.ts`: rename the persisted storage key to Rupa. Existing local body profile data can reset.
- Modify `docs/product.md`: rename product identity and keep product scope intact.

## Task 1: Shared Rupa Theme

**Files:**
- Create: `src/theme/brand.ts`

- [ ] **Step 1: Create the brand theme module**

```ts
export const brand = {
  name: "Rupa",
  colors: {
    background: "#f7f0e6",
    surface: "#fffaf3",
    text: "#241810",
    mutedText: "#6f6255",
    border: "#eadfce",
    primary: "#8f0000",
    primaryText: "#fffdf8",
    accent: "#0f8f98",
    inactive: "#737373",
  },
} as const;
```

- [ ] **Step 2: Do not add tests for constants-only theme**

Run after later tasks: `npx tsc --noEmit`

Expected: TypeScript accepts imports from `src/theme/brand.ts`.

## Task 2: Expo and Package Identity

**Files:**
- Modify: `app.json`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Update Expo metadata**

Set `app.json` to these identity values:

```json
{
  "expo": {
    "name": "Rupa",
    "slug": "rupa",
    "scheme": "rupa",
    "icon": "./assets/rupa-app-icon/rupa-icon-1024-appstore.png",
    "splash": {
      "image": "./assets/rupa-app-icon/rupa-icon-1024-appstore.png",
      "resizeMode": "contain",
      "backgroundColor": "#f7f0e6"
    },
    "ios": {
      "bundleIdentifier": "com.balancinglife.rupa"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/rupa-app-icon/rupa-icon-1024-appstore.png",
        "backgroundColor": "#f7f0e6"
      }
    },
    "web": {
      "favicon": "./assets/rupa-app-icon/rupa-icon-512-preview.png"
    }
  }
}
```

Preserve all unrelated existing keys in `app.json`.

- [ ] **Step 2: Update package root name**

Change `package.json` root name:

```json
{
  "name": "rupa"
}
```

Change the root package name in `package-lock.json` to `rupa` wherever it mirrors the root package only. Do not edit dependency package names.

- [ ] **Step 3: Inspect identity references**

Run:

```bash
rg -n "next-move|nextmove|Next Move|NEXT MOVE|루파" app src docs package.json package-lock.json app.json
```

Expected: only intentional historical references inside spec/plan docs remain, or no matches outside docs.

## Task 3: App UI Brand Text and Colors

**Files:**
- Modify: `app/index.tsx`
- Modify: `src/components/HomeGlassCard.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/BottomTabBar.tsx`
- Modify: `src/components/SimulationInputStage.tsx`
- Modify: `src/components/SimulationCanvasStage.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Import the brand theme where brand colors or name are used**

Use this import path from `app/` files:

```ts
import { brand } from "../src/theme/brand";
```

Use this import path from nested `app/(tabs)/` files:

```ts
import { brand } from "../../src/theme/brand";
```

Use this import path from `src/components/` files:

```ts
import { brand } from "../theme/brand";
```

- [ ] **Step 2: Replace visible app names**

Change all visible old brand headers:

```tsx
<AppHeader showDivider={false} title={brand.name} />
```

Change the home brand label:

```tsx
<Text style={styles.brand}>{brand.name}</Text>
```

- [ ] **Step 3: Apply minimal shared brand colors**

Use `brand.colors.background` for main cream backgrounds, `brand.colors.text` for core dark text, `brand.colors.primary` for existing primary red action affordances, `brand.colors.primaryText` for text on primary actions, and `brand.colors.inactive` for inactive tab labels.

Keep component layout, spacing, and flow unchanged.

- [ ] **Step 4: Rename storage key**

Change `src/store/useBodyProfileStore.ts` storage key to:

```ts
name: "rupa-body-profile",
```

This intentionally resets old local profile data from the previous brand.

## Task 4: Product Docs

**Files:**
- Modify: `docs/product.md`

- [ ] **Step 1: Rename the product doc**

Use this product intro:

```md
# Rupa

## Product

Rupa는 실내 볼더링에서 막혔을 때, 벽 사진 위에서 내 몸 기준으로 다음 무브를 직접 시험해보는 볼더링 시뮬레이터 앱이다.
```

Preserve the existing core experience, non-goals, V1 scope, and V1 exclusions unless they mention the old brand.

## Task 5: Verification

**Files:**
- Read-only verification across changed files

- [ ] **Step 1: Search for old public brand references**

Run:

```bash
rg -n "Next Move|NEXT MOVE|nextmove|루파" app src docs/product.md package.json app.json
```

Expected: no output.

- [ ] **Step 2: Search for `next-move` references and classify them**

Run:

```bash
rg -n "next-move" app src docs/product.md package.json package-lock.json app.json
```

Expected: no output.

- [ ] **Step 3: Run Expo TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: command exits 0.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git diff -- app.json package.json package-lock.json app src docs/product.md
```

Expected: diff contains only Rupa identity, color token wiring, and product doc changes. It should not include route detection API contract changes, simulation behavior changes, or generated `.superpowers/` files.
