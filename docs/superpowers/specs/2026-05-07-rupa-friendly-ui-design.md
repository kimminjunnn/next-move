# Rupa Friendly UI Design

## Task Contract

Shift the Expo app UI from the current minimal Rupa rebrand into a friendlier Rupa visual system.

The target feeling is a real bouldering gym wall with a cute monkey companion. The app should feel approachable and playful, but still work as a practical climbing route simulation tool.

This pass should change visual atmosphere, color tokens, home CTA styling, common cards, headers, tabs, input/settings surfaces, and simulation control accents. It should not change screen structure, user-facing copy, route detection behavior, simulation state machines, API contracts, profile calculation logic, or navigation structure.

Owned files are expected to be in:

- `src/theme/brand.ts`
- `app/index.tsx`
- `app/_layout.tsx`
- `app/(tabs)/settings.tsx`
- `app/skeleton-lab.tsx` if old theme colors remain visible in the lab
- `src/components/AppHeader.tsx`
- `src/components/BottomTabBar.tsx`
- `src/components/HomeGlassCard.tsx`
- `src/components/HomeHeroHolds.tsx`
- `src/components/SimulationBackground.tsx`
- `src/components/SimulationInputStage.tsx`
- `src/components/SimulationCanvasStage.tsx`
- `src/components/SimulationAdjustStage.tsx`
- `src/components/ConfirmModal.tsx`
- `src/components/ProfileDrawer.tsx` if it remains reachable
- `src/components/RouteHighlightOverlay.tsx`
- `src/components/SkeletonPoseOverlay.tsx`

Generated `.superpowers/` brainstorming artifacts do not belong in git.

## Visual Contract

The chosen direction is the plywood climbing-wall direction, based on the user's reference gym photo.

Rupa-like means:

- friendly climbing gym
- cute monkey companion
- plywood bouldering wall atmosphere
- small screw holes / T-nut speckles on large warm wall surfaces
- colorful holds in blue, yellow, pink, and green
- yellow hold / banana color as the main action color
- blue hold / chalk-bag color as a secondary route/tool accent
- monkey brown for text, shadows, and quiet supporting surfaces
- gray/black gym volumes and mats as supporting neutral tones

Remove red as the primary action color. Red should be reserved for destructive or error actions only.

The primary app palette should become:

- `wall`: plywood climbing wall beige
- `wallLight`: lighter worn plywood surface
- `wallSpeck`: small dark screw-hole / T-nut dot color
- `surface`: warm card surface derived from plywood
- `primary`: yellow hold / banana yellow
- `primaryPressed`: deeper mustard yellow
- `primaryText`: dark monkey brown
- `accent`: blue hold / chalk-bag blue
- `accentPink`: pink hold
- `accentGreen`: green hold
- `text`: dark monkey brown
- `mutedText`: softer brown-gray
- `border`: warm plywood seam border
- `gymGray`: mat/ceiling gray
- `danger`: restrained red for delete/error only

Avoid a clean beige-only app. The wall background should include subtle dot texture, and selected colorful hold accents should make the app feel like a real climbing wall without becoming visually noisy.

## UX Contract

The home screen should show the new mood immediately.

Change the `시작하기` CTA from red to yellow hold / banana yellow. Its shape can stay large and reachable, but it should sit on a plywood-wall style background with screw-hole speckles and colorful hold accents.

Do not change home copy. Do not add a new onboarding flow. Keep the existing entry path into simulation and skeleton lab.

Simulation input and settings should share the same palette:

- plywood wall screen backgrounds
- subtle screw-hole / T-nut dot texture on major empty backgrounds
- soft warm card surfaces
- yellow primary actions and active states
- blue hold route/tool accents
- warm cream secondary chips/badges
- brown text and icon tones

The simulation canvas should preserve photo readability. Keep the dark canvas base, but replace peach/salmon action accents with yellow hold primary actions and blue hold route/tool accents. Route-edit panels should feel like Rupa tools, not warning panels.

Destructive actions, validation errors, and failed analysis messages may keep restrained red tones.

## Asset Contract

Use existing assets first. The current home hold PNGs can remain, but their placement and opacity should support the plywood climbing-wall tone.

If a plywood wall texture is implemented, prefer a lightweight React Native view layer made from repeated small dots and warm background colors over adding a large bitmap background. This keeps the UI scalable and avoids asset preparation. The texture must be subtle enough that text and controls remain readable.

The mascot assets under `assets/rupa_theme/` are reference art. This pass may use the Rupa app icon or cropped static mascot art only if it can be integrated cleanly without new image-generation work or fragile cropping. If integrating mascot art requires asset preparation, leave that as a separate follow-up.

Do not commit private gym photos or generated debug outputs.

## Interface Contract

No API contracts should change.

Do not change:

- Expo route detection payloads
- Nest wall analysis routes
- FastAPI vision schemas
- body profile calculations
- skeleton pose solver behavior
- route selection state behavior

Theme changes should flow through `src/theme/brand.ts` where practical. Local hardcoded colors are acceptable only for:

- true black/dark photo canvas areas
- white overlays on photo/canvas
- route object colors derived from detection results
- destructive/error states
- SVG shadows or alpha overlays that are tightly coupled to drawing logic

## Verification Contract

Run:

```bash
npx tsc --noEmit
```

Search for old primary red and peach usage and classify remaining cases:

```bash
rg -n "#8f0000|#7a1f12|#ffb37a|#ffddb7|#ffc999" app src
```

Expected remaining uses:

- none for primary CTA or active tab state
- only justified destructive/error/canvas overlay colors, or no output

Search for old brand text:

```bash
rg -n "Next Move|NEXT MOVE|nextmove|루파|next-move" app src docs/product.md package.json package-lock.json app.json
```

Expected: no output.

If visual changes affect multiple screens, start the Expo dev server and inspect the app:

```bash
npx expo start --dev-client --host lan
```

When testing on a physical phone, `EXPO_PUBLIC_WALL_API_URL` must point to the Mac's LAN IP, not `localhost`.
