# Skeleton Pose Overlay Design

## Status

Approved for design by the user on 2026-05-02.

This document defines the first MVP for a realistic-feeling skeleton overlay in
the Expo simulation screen. It intentionally does not implement hold snapping,
route physics, balance scoring, or automatic contact failure.

## Product Goal

After a user places or selects a climbing wall photo, the simulation screen
should show a human-like 2D skeleton over the photo. The user can drag the four
limb endpoints, both hands and both feet, and the rest of the skeleton should
move in a way that feels like a real body rather than a freely stretching stick
figure.

The feature should work before hold detection is complete. Later, detected hold
coordinates can become snap targets for the same hand and foot controls.

## Non-Goals

- No hold snapping in the MVP.
- No wall-scale calibration in the MVP.
- No automatic foot or hand detach behavior.
- No center-of-gravity or balance scoring.
- No external physics engine such as Matter.js in the first version.
- No new native mobile dependency unless a later implementation review proves it
  is necessary.

## User Model

The app already stores a body profile:

- `height`: user height in centimeters.
- `wingspan`: user reach in centimeters.
- `wingspanMode`: whether reach is auto-derived or custom.

The skeleton should initialize from these values. Because the wall photo is not
yet calibrated to real-world centimeters, the MVP should also expose a manual
skeleton scale control. The body profile defines proportions; the scale control
defines how large those proportions appear on the current photo.

Arm and leg segment lengths should use average human anthropometric proportions
of total height:

- upper arm: about 17.25%
- forearm: about 15.85%
- thigh: about 24.05%
- lower leg: about 25.2%

## Interaction Design

The skeleton appears centered over the current simulation photo.

The user can drag four visible endpoint handles:

- left hand
- right hand
- left foot
- right foot

The user can also drag the four middle limb joints:

- left elbow
- right elbow
- left knee
- right knee

Dragging a middle joint changes the visible bend direction while preserving the
modeled segment lengths. The whole skeleton can be moved by dragging the body
center handle.

Dragging a hand or foot moves that target. The corresponding limb must not
stretch beyond its modeled length. If the target is farther than the limb can
reach from the current shoulder or hip, the solver should move the shoulder,
hip, and torso enough to make the pose feel natural, while still respecting
maximum reach limits.

The MVP should include:

- small visible handles for hands and feet
- smaller visible handles for elbows and knees
- a body-center handle for moving the whole skeleton
- visible handle radii that scale down with the skeleton while preserving a
  practical minimum touch target
- semi-transparent skeleton lines so the photo remains readable
- visual emphasis for the active dragged handle
- a compact scale control that can shrink below the original 55% minimum
- a reset control that returns the skeleton to the default pose

The MVP should not require the user to select contact points, detach limbs, or
manage body physics.

## Technical Approach

Use a custom 2D inverse-kinematics style solver, not a general physics engine.

The first implementation should rely on existing app dependencies:

- `react-native-gesture-handler` for drag gestures
- `react-native-reanimated` for smooth interaction state where useful
- `react-native-svg` for rendering the skeleton overlay
- existing Zustand store patterns for simulation state if persistence is needed

Matter.js or another physics engine is deferred. A rigid-body constraint engine
is a better fit for collision, gravity, and falling behavior than for the MVP's
main need: predictable manual pose editing with human-like limb constraints.

Keep the solver isolated so a future physics-assisted solver can replace or
augment it without rewriting the overlay UI.

## Proposed Modules

- `src/types/skeletonPose.ts`
  - joint ids
  - limb ids
  - pose state
  - body model proportions
  - drag handle ids

- `src/lib/bodyModel.ts`
  - derives approximate body segment lengths from `height` and `wingspan`
  - separates real-world proportions from screen scale

- `src/lib/skeletonPoseSolver.ts`
  - receives current pose, dragged endpoint, target point, body model, and scale
  - returns resolved joint positions
  - enforces limb lengths and natural elbow/knee bend direction
  - moves torso/shoulder/hip when target reach requires it

- `src/components/SkeletonPoseOverlay.tsx`
  - renders SVG skeleton lines and endpoint handles
  - owns gesture mapping for hand and foot drags
  - exposes callbacks or state updates for resolved pose

- `src/components/SimulationCanvasStage.tsx`
  - mounts `SkeletonPoseOverlay` above the photo and route highlight overlays
  - passes viewport dimensions and current simulation photo transform
  - keeps the feature independent from hold detection success or failure

- `src/store/useSimulationStore.ts`
  - may store skeleton scale and pose if persistence across screen transitions is
    needed

## Coordinate Contract

The skeleton MVP can initially operate in viewport coordinates because there is
no hold snapping or wall calibration yet.

When hold detection is connected later, hand and foot targets should be mapped
through the existing photo, viewport, and analysis coordinate helpers in
`src/lib/simulationViewport.ts`.

The solver should not depend on analysis image coordinates. It should receive
plain 2D points in the coordinate space selected by the caller.

## Solver Behavior

The MVP solver should be deterministic and easy to tune.

Expected behavior:

- Limb segment lengths remain constant.
- Hand drag resolves shoulder, elbow, and hand.
- Foot drag resolves hip, knee, and foot.
- Elbow and knee drag resolves that joint and its limb endpoint.
- Whole-body drag translates all joints together.
- The default pose should be an upright attention pose with arms and legs
  hanging nearly straight down, not a wide frog-like crouch.
- If an endpoint target is within reach, the torso can stay mostly stable.
- If an endpoint target exceeds comfortable reach, torso and pelvis shift toward
  the target before clamping the endpoint.
- Elbows and knees bend in consistent, human-readable directions.
- The solver returns a complete pose every frame.

Out-of-scope behavior:

- gravity
- velocity-based falling
- collision with wall or holds
- automatic contact state changes
- pose validity scoring

## Verification Contract

Implementation should be verified with:

```bash
npx tsc --noEmit
```

Manual checks:

- Add or select a simulation photo.
- Confirm the skeleton appears over the photo even if hold detection is not
  available.
- Drag each hand and foot independently.
- Drag each elbow and knee independently.
- Drag the body center handle and confirm the whole skeleton moves together.
- Confirm arms and legs do not visually stretch.
- Confirm torso/hip/shoulder positions follow when a target reaches beyond the
  current limb position.
- Confirm scale control changes skeleton size and can shrink below 55%.
- Confirm reset returns to the default pose.

## Artifact Contract

Commit-worthy artifacts:

- TypeScript source files for the body model, solver, overlay, and integration.
- Focused tests if the solver is extracted into pure functions.
- This design document if the team wants to retain implementation context.

Generated or local-only artifacts:

- `.superpowers/brainstorm/` visual companion files.
- route detection debug outputs.
- private gym photos or regression images unless explicitly approved.
