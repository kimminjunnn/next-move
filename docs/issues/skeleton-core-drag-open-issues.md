# Skeleton Core Drag Open Issues

Date: 2026-05-07

## Context

Skeleton core drag behavior was investigated in this session, but the attempted
fixes did not satisfy the real touch interaction. The core-drag related solver
changes from the session were reverted. At the end of the session,
`src/lib/skeletonPoseSolver.ts` and `src/lib/skeletonPoseSolver.test.js` had no
remaining diff from the session's starting point.

## Unresolved Requirements

### 1. Release core drag when folding inward during the same gesture

Expected behavior:

- When a hand or foot is dragged into a straight line and then pushed, it should
  enter straight core drag.
- Without lifting the finger, if the handler is dragged inward and the limb
  bends again, the interaction should stop behaving like core drag and should
  fold the limb naturally.
- If the limb is straightened again and pushed again in the same gesture, it
  should enter straight core drag again.

Observed problem:

- After entering straight core drag, dragging inward toward the shoulder or
  pelvis can still make the core suddenly push or slide.
- The same kind of problem also appears when dragging elbow and knee handlers,
  not only hand and foot handlers.

### 2. Smooth straight core drag while pushing along a straight limb

Expected behavior:

- When a hand or foot is straight and pushed along the limb direction, the core
  should move smoothly and continuously.
- The dragged limb should not visibly buckle, jitter, or step while the core is
  moving.

Observed problem:

- The core drag can move in a clunky, step-like way.
- The dragged limb can appear to bend slightly while the core moves, making the
  motion feel unnatural.

### 3. Natural limits for excessive core drag

Expected behavior:

- If the user pushes or pulls too far, the body should hit a natural movement
  limit instead of letting the core follow indefinitely.
- The limit should feel human: small core drags should remain responsive, while
  excessive drags should slow or stop.

Observed problem:

- Without a good limit, the skeleton can move in a way that does not resemble a
  real body.
- A simple anchor-reach based limit was attempted, but it was not validated as
  the desired feel and was reverted.

## Attempts That Did Not Resolve It

- Releasing `canUseCoreDrag` instead of latching it forever during an endpoint
  drag.
- Switching endpoint drag solve basis from `dragStartPose` to `currentPose`
  after entering core mode.
- Keeping current-pose basis for the rest of an endpoint drag session after the
  first core frame.
- Applying similar current-pose behavior to elbow and knee drags.
- Using body-paced frame limiting when endpoint or joint drags resolve as core
  motion.
- Making straight endpoint core drag keep the dragged hand or foot closer to the
  handler target while anchoring other endpoints.
- Adding an anchor-reach clamp for excessive core movement.

These attempts passed unit tests at the time, but they did not match the actual
touch behavior reported by the user. The core-drag solver changes from these
attempts were reverted.

## Current State

- Solver behavior is back to the session's starting state.
- Existing tests pass:
  - `node --test src/lib/skeletonPoseInteraction.test.js`
  - `node --test src/lib/skeletonPoseSolver.test.js`
  - `npx tsc --noEmit`
- The UX issues above remain open.

## Suggested Next Investigation

The next pass should start from observed gesture traces rather than more solver
guesswork. Capture, per move frame:

- handler kind and id
- `gestureState.dx` / `gestureState.dy`
- drag start point
- active mode before and after solve
- whether straight core drag is allowed
- pose basis used for solving
- target point
- root, joint, and endpoint positions before and after solve

Then compare the exact frame where the skeleton first jumps or starts jittering.
This should reveal whether the root cause is:

- stale `dragStartPose` / `currentPose` basis mismatch,
- `PanResponder` cumulative delta interacting badly with pose-basis switching,
- solver core-mode classification staying active too long,
- frame limiting and bone reprojection fighting each other,
- or a deeper mismatch in how core drag should anchor the dragged limb versus
  the other endpoints.
