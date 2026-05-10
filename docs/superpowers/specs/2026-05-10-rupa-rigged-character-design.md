---
title: Rupa Rigged Character Design
tags:
  - rupa
  - skeleton
  - character-rig
  - simulation
category: design
updated: 2026-05-10
---

# Rupa Rigged Character Design

## Task Contract

Add a back-view Rupa monkey character over the existing skeleton pose system.
The character should be built from raster parts, not procedural SVG character
art, so it can follow a production-style asset pipeline.

The existing skeleton solver remains the control rig. This work adds a render
rig that maps the solver's joint positions to image parts.

In scope:

- Back-view climbing character only.
- Raster body parts under `assets/rupa_theme/character/back/`.
- A typed rig manifest that maps each part to skeleton joints.
- A renderer that positions, rotates, and scales parts from `pose.joints`.
- Skeleton lab and simulation verification.

Out of scope:

- Front-view face or expression work.
- Replacing the skeleton solver.
- Hold snapping, balance scoring, or physics.
- Nest API, FastAPI, or route detection contract changes.
- Native animation dependencies such as Rive or Spine for this pass.

## Visual Contract

Use `assets/rupa_theme/references/theme1.png` as the visual reference:

- Brown plush monkey body.
- Back-view head and ears.
- Long arms and compact legs.
- Curled tail.
- Pale hands and feet.
- Teal chalk bag near the pelvis.

The first implementation should prefer a readable, stable rig over perfect fur
detail. Asset polish can improve the same rig later.

## Interface Contract

The render rig consumes:

- `SkeletonPose`
- `SkeletonBodyModel`
- current overlay mode
- optional active control id for drag visibility

The render rig does not own gesture handling. It must render with
`pointerEvents="none"` so existing hit areas continue to work.

The implementation should create these boundaries:

- `src/types/characterRig.ts`: shared rig metadata types.
- `src/lib/rupaCharacterRig.ts`: static part manifest and pure transform helpers.
- `src/components/RiggedImagePart.tsx`: one image part renderer.
- `src/components/RupaCharacterLayer.tsx`: full character layer.
- `src/components/SkeletonPoseOverlay.tsx`: integration point only.

Expo static assets should be imported with explicit `require(...)` entries in
the manifest. Do not rely on dynamic asset paths.

## Asset Contract

Commit-worthy assets:

- Transparent PNG or WebP part files required by the manifest.
- Asset source notes if a generation or editing prompt is used.

Local-only assets:

- discarded image-generation variants
- temporary chroma-key sources
- debug screenshots

Initial asset list:

- `head-back.png`
- `head-left.png`
- `head-right.png`
- `ear-left.png`
- `ear-right.png`
- `torso-back.png`
- `upper-arm-left.png`
- `forearm-left.png`
- `hand-left.png`
- `upper-arm-right.png`
- `forearm-right.png`
- `hand-right.png`
- `thigh-left.png`
- `shin-left.png`
- `foot-left.png`
- `thigh-right.png`
- `shin-right.png`
- `foot-right.png`
- `tail.png`
- `chalk-bag.png`

## Verification Contract

Automated checks:

```bash
npx tsc --noEmit
node --test src/lib/rupaCharacterRig.test.js
```

Manual checks:

- Open skeleton lab.
- Drag each hand, foot, elbow, knee, head, and body.
- Confirm the character follows the pose without blocking touch handling.
- Confirm the back-view read is clear in simulating mode.
- Confirm sizing mode still exposes enough skeleton controls to fit the body.
- Confirm the character does not make route highlights unreadable on a photo.

## Compound Notes

Reusable lessons should be recorded in this spec or a follow-up doc:

- part dimensions that read well on mobile
- pivot conventions for future front-view parts
- z-order conventions for body, limbs, tail, and chalk bag
- asset generation prompts or source notes that produced usable results

Current reusable rig lessons:

- Upper-arm art should not start directly at the skeleton shoulder point when
  the character has a large head or torso. Use `fromOffset` on limb parts to
  place visual shoulder sockets below and outside the skeleton shoulders.
- Limb endpoint offsets must scale with `SkeletonBodyModel.scale`; otherwise
  the character fit changes when the user resizes the body.
- In simulating mode, the skeleton is the hidden control rig. Keep hit areas
  active and sized around the character parts, but render skeleton guides at
  zero opacity so users drag the character instead of visible handles.
- When using a human-like skeleton for a monkey character, avoid solving the
  mismatch by making the head and torso bigger. A more stable read is a
  gibbon-like silhouette: narrow vertical torso, visually strong upper arms,
  and long arms that can still follow the existing human-proportion joints.
- Do not make the upper arms visually dominant just to compensate for long-arm
  monkey proportions. The leg parts are the better proportion reference:
  rounded, tapered-looking capsules with moderate thickness. Arm balance should
  stay close to the forearms while the full silhouette gets its monkey read from
  shoulder offsets and arm reach.
- Shoulder socket offsets should not always participate in limb length. For
  upper arms, use visual socket offsets for placement/rotation, but measure
  length from the underlying skeleton joints so raised-arm poses do not inflate
  the rendered arm part.
- Head direction is a render-rig concern, not a solver concern. Use facing
  variants (`back`, `left`, `right`) selected from active hand intent and reach
  direction, and keep head anchor rotation clamped so extreme head drags cannot
  flip the face upside down.
- Tail motion should start as pose-driven sway. Feed a bounded `tailSwayDeg`
  transform option from body lean and asymmetric hand reach; reserve segmented
  tail physics for a later polish pass.
- Head drag limits belong in the skeleton solver as well as the render rig.
  Render clamping prevents upside-down art, but the actual head joint must stay
  in the upper hemisphere around the neck so dragging feels physically plausible.
- Mascot-quality head assets should be treated differently from procedural
  placeholder body parts. Preserve the final `head-back`, `head-left`, and
  `head-right` PNGs by default; only regenerate placeholder heads when
  explicitly passing `--with-placeholder-heads`.
- Before replacing active character art, snapshot the existing transparent PNGs
  into a versioned sibling directory. Current rollback points:
  `assets/rupa_theme/character/back-v1-procedural/` for the procedural pass and
  `assets/rupa_theme/character/back-v2-plush-3d/` for the 3D plush pass, and
  `assets/rupa_theme/character/back-v3-2d/` for the generated 2D sheet pass.
- Import scripts must refuse to overwrite existing assets unless
  `--replace-active` is passed. This keeps active art replacement intentional
  and makes rollback points explicit.

## Asset Source Notes

The first-pass assets under `assets/rupa_theme/character/back/` were generated
locally by `scripts/generate_rupa_character_parts.mjs`. They are RGBA PNGs with
transparent backgrounds and are intended to validate the raster-part rig
pipeline, pivot conventions, and Expo asset loading.

The production head variants were generated from the Rupa face reference in
`assets/rupa_theme/references/theme2.png`, then imported with
`scripts/import_rupa_head_sheet.mjs`. The source sheet is local-only; the
commit-worthy artifacts are the transparent 360x340 PNGs named
`head-back.png`, `head-left.png`, and `head-right.png`.

The first procedural body snapshot is preserved at
`assets/rupa_theme/character/back-v1-procedural/`. To return to that visual
state, copy the PNGs from that directory back into
`assets/rupa_theme/character/back/` and restore the matching `nativeSize`
metadata if the active rig has moved to higher-resolution assets.

The plush body/tail/chalk-bag assets were generated from the same Rupa visual
language as `theme1.png` and `theme2.png`, then imported with:

```bash
node scripts/import_rupa_body_sheet.mjs <body-sheet.png> assets/rupa_theme/character/back --replace-active
```

The active body files now use 2x native dimensions while preserving the same
display aspect ratios. This keeps the render rig stable while improving
texture quality.

The 3D plush pass was preserved at
`assets/rupa_theme/character/back-v2-plush-3d/` after it proved visually
mismatched with the rest of the rig. The active `back/` directory now uses a
2D illustrated pass for head, body, limbs, tail, hands, feet, and chalk bag.
The 2D head sheet follows the canonical `left`, `back`, `right` order, so
`scripts/import_rupa_head_sheet.mjs` maps cells directly to
`head-left.png`, `head-back.png`, and `head-right.png`.

The generated 2D body pass was preserved at
`assets/rupa_theme/character/back-v3-2d/` after hand/foot direction and hard
part boundaries read poorly on the rig. The active `back/` directory now uses a
rig-friendly hybrid pass: current 2D head variants are preserved, while body,
limbs, hands, feet, tail, and chalk bag come from
`assets/rupa_theme/character/back-v4-rig-friendly/`. This keeps the first
procedural pass's softer overlap behavior, adds clearer hand-back and foot-top
endpoints, and avoids overwriting any older rollback directory.
