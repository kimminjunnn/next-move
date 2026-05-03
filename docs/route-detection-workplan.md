# Route Detection Workplan

This document captures the current branch state and the contracts agents should use before continuing route detection work.

## Current Branch State

Branch: `feat/route-detection`

The branch is moving from mock route detection to a real image-analysis flow:

- Expo uploads a wall photo and renders detected object outlines.
- Nest API forwards wall analysis and route selection requests to the vision service.
- FastAPI vision service loads images and uses OpenCV heuristics to detect holds and volumes.
- Local debug artifacts show several tuning attempts for the same wall photo.

## Classification

Commit candidates:

- `AGENTS.md`
- `docs/local-dev-runbook.md`
- `docs/route-detection-workplan.md`
- Expo route detection UI and coordinate mapping changes under `app/` and `src/`
- Nest error-contract changes under `nest-api/src/`
- Vision service source changes under `vision-service/app/`
- `vision-service/tools/run_wall_detection_debug.py`
- `vision-service/regression_inputs/README.md`
- `vision-service/requirements.txt`

Generated artifacts:

- `vision-service/debug_outputs*/`
- `vision-service/**/__pycache__/`
- local virtualenv contents under `vision-service/.venv/`

Review before keeping:

- `package.json` and `package-lock.json` additions for mobile OpenCV/color packages. They are currently not imported by app code.
- Minor button-height changes in `app/index.tsx` and `app/(tabs)/settings.tsx`; keep only if they are intentional UI polish for this branch.

Needs more implementation:

- OpenCV detection tuning. Current debug output appears under-detected compared with earlier debug runs.
- Regression image strategy. The README exists, but no approved fixture images are present.
- Verification across Expo, Nest, and FastAPI contracts.

## Task Contract

For the next implementation pass, keep tasks scoped by layer:

- Vision service: improve detection quality, debug runner behavior, generated artifact handling, and Python verification.
- Expo UI: verify photo-space and viewport-space coordinate conversion, route overlay display modes, and tap selection behavior.
- Nest API: verify wall-analysis and route-selection error mapping.
- Dependency cleanup: remove unused mobile-native dependencies unless a concrete on-device vision plan is approved.
- Docs and hygiene: keep local run instructions and artifact rules current.

Non-goals:

- Do not rewrite the route detection system around a new ML model in this pass.
- Do not commit private gym photos or debug output images without explicit approval.
- Do not add more native mobile dependencies unless the implementation imports and uses them.

## Interface Contract

Expo to Nest:

- `POST /api/v1/wall-analyses` accepts a wall photo file and returns an analysis with image metadata and detected objects.
- `POST /api/v1/wall-analyses/:analysisId/route` accepts a start hold object id and returns route color plus included object ids.

Nest to FastAPI:

- `POST /internal/analyze-wall` accepts `imagePath` or `imageUrl`.
- `POST /internal/select-route` accepts `analysisId`, `startHoldObjectId`, and detected objects.

Detected object fields must stay aligned across layers:

- `id`
- `kind`
- `bbox`
- `center`
- `contour`
- `color.hex`
- `parentVolumeObjectId`

## Verification Contract

Use the narrowest relevant checks for each task:

```bash
npx tsc --noEmit
cd nest-api && npx tsc --noEmit
cd vision-service && source .venv/bin/activate && python -m compileall app tools
cd vision-service && source .venv/bin/activate && python tools/run_wall_detection_debug.py
```

For detection changes, also inspect overlay images and record before/after object counts. JSON counts alone are not enough.

## Artifact Contract

Keep in git:

- source code
- docs
- debug runner scripts
- regression input README

Keep out of git by default:

- debug output images and JSON
- Python bytecode caches
- private or unapproved regression photos
- local virtualenv files

Approved regression fixtures can be force-added later with a clear note about source and permission.

## Sub-Agent Task Breakdown

Use these tasks as the next Sub-agent Driven implementation queue.

### Task 1: Vision Service Detection Hygiene

Owned files:

- `vision-service/app/object_detection.py`
- `vision-service/app/image_loader.py`
- `vision-service/app/route_helper.py`
- `vision-service/app/routes.py`
- `vision-service/tools/run_wall_detection_debug.py`
- `vision-service/requirements.txt`

Contract:

- Keep the current FastAPI request/response schema stable.
- Make the debug runner deterministic and useful when no regression images exist.
- Improve detection only with evidence from overlay inspection and before/after object counts.
- Do not commit generated debug outputs.

Verification:

```bash
cd vision-service && source .venv/bin/activate && python -m compileall app tools
cd vision-service && source .venv/bin/activate && python tools/run_wall_detection_debug.py
```

### Task 2: Expo Route Overlay and Tap Selection

Owned files:

- `src/components/SimulationCanvasStage.tsx`
- `src/components/RouteHighlightOverlay.tsx`
- `src/lib/simulationViewport.ts`
- related simulation types if needed

Contract:

- Keep photo-space and viewport-space coordinate conversion explicit.
- Ensure initial analysis shows detected holds and route mode highlights included objects.
- Preserve tap-to-select behavior after pan/zoom transforms.
- Keep UI copy concise and mobile-safe.

Verification:

```bash
npx tsc --noEmit
```

Manual check:

- Load a wall photo in the dev client.
- Confirm outlines align after zoom/pan.
- Tap multiple holds and confirm selected route state updates.

### Task 3: Nest API Error Contract

Owned files:

- `nest-api/src/modules/vision-client/`
- `nest-api/src/modules/wall-analyses/`

Contract:

- Keep FastAPI errors mapped to stable user-facing Nest errors.
- Do not leak internal file paths or raw service errors to the mobile app.
- Preserve existing wall-analysis response shape.

Verification:

```bash
cd nest-api && npx tsc --noEmit
```

### Task 4: Dependency Cleanup

Owned files:

- `package.json`
- `package-lock.json`

Contract:

- Remove unused mobile-native packages unless a concrete on-device image processing task imports them.
- Avoid changes that force unnecessary native rebuilds.
- Keep package lock consistent with `package.json`.

Verification:

```bash
npm install
npx tsc --noEmit
```

### Task 5: Final Integration Review

Owned files:

- no broad ownership; review only unless a defect is found

Contract:

- Confirm all layer contracts still align.
- Confirm generated artifacts stay ignored.
- Confirm verification commands pass or document exact blockers.
- Produce a concise summary of remaining product risks.
