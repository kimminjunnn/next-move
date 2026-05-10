# AGENTS.md

Repository guidance for AI agents working on Next Move.

## Project Shape

This repo has three active surfaces:

- `app/` and `src/`: Expo React Native app. This is the user-facing mobile experience.
- `nest-api/`: NestJS API that receives mobile requests and talks to supporting services.
- `vision-service/`: FastAPI/Python service for wall image analysis and route detection.

Treat these as one product. Changes in one layer often require checking the contract in the other two.

## Working Principles

- Start every session by checking `git status --short`, the current branch, and the relevant diff.
- Preserve user work. Do not revert, delete, or overwrite unrelated changes unless explicitly asked.
- Prefer small, reviewable edits that follow existing file structure and naming.
- Do not commit, push, or open PRs unless the user explicitly asks.
- Before editing generated or debug files, decide whether they should be committed at all.
- Keep Korean user-facing copy natural and concise. Avoid mixing English unless it is already product language.

## Sub-Agent Driven Development

Use this mode when the user explicitly asks for sub-agents, Sub-agent Driven Development, or parallel agent work.

The controller agent owns coordination:

1. Read the current diff and write a short task breakdown.
2. Split work into independent tasks with clear file ownership.
3. Dispatch one implementer sub-agent per task unless the tasks have disjoint write sets and the user asked for parallel work.
4. Tell sub-agents they are not alone in the codebase and must not revert edits they did not make.
5. After each implementation task, run two review passes:
   - Spec review: does the change match the task contract exactly?
   - Quality review: is the implementation maintainable, tested, and consistent with the repo?
6. Send issues back to the implementer and re-review until the task is accepted.
7. Integrate results locally and run the relevant verification commands.

Do not let implementation sub-agents edit the same files in parallel. For this repo, likely write sets are:

- Expo UI: `app/`, `src/components/`, `src/lib/`, `src/store/`, `src/types/`
- Nest API: `nest-api/src/`
- Vision service: `vision-service/app/`, `vision-service/tools/`, `vision-service/requirements.txt`
- Docs: `docs/`, `AGENTS.md`

## Main Loop: Plan -> Work -> Review -> Compound

Use the same four-step loop for both 5-minute fixes and multi-day features. Scale the time spent in each step to the size and risk of the task.

The first three steps produce the change. The fourth step improves the system that produces future changes.

### 1. Plan

- Understand the requirement: what to build, why it matters, and what constraints apply.
- Inspect the codebase: find similar features, contracts, and existing patterns before designing a solution.
- Check external references when needed: framework docs, API docs, and current best practices.
- Design the solution: identify the approach, affected files, and cross-surface contracts across Expo, Nest API, and FastAPI.
- Validate the plan: check for missing states, unclear boundaries, and mismatched assumptions before editing.
- For multi-part work, write a compact contract before implementation:
  - Task contract: behavior change, non-goals, owned files, and expected output.
  - Interface contract: request/response shapes, env vars, filesystem inputs, and error semantics.
  - Verification contract: exact commands or manual checks that prove the work.
  - Artifact contract: what belongs in git and what is generated locally.

### 2. Work

- Isolate the work with a branch or git worktree when the change is large, risky, or likely to overlap with other edits.
- Execute the plan step by step, keeping edits small and aligned with the existing structure.
- Run verification after meaningful changes: tests, linting, type checks, compile checks, or targeted manual checks.
- Track progress and revise the plan when new facts invalidate an assumption.
- If the plan is clear, trust the implementation path; do not churn code line by line without a reason.

### 3. Review

- Review for correctness first: does the change match the task contract exactly?
- Review for quality second: maintainability, type safety, error handling, test coverage, and consistency with local patterns.
- Use priority labels for findings:
  - P1: must fix before completion.
  - P2: should fix when practical.
  - P3: improvement or follow-up.
- When using sub-agents or parallel review, keep write sets separate and have each reviewer focus on specific risks.
- Fix review findings, then rerun the relevant verification.
- Record recurring failure patterns so the same issue is easier to catch next time.

### 4. Compound

- Capture what worked, what failed, and what insight can be reused.
- Turn repeated lessons into durable instructions in `AGENTS.md`, a focused doc under `docs/`, or a reusable agent/task pattern.
- When creating knowledge docs, use YAML frontmatter with metadata such as `title`, `tags`, `category`, and `updated` so the note is searchable.
- Ask whether the system can catch this class of issue automatically next time through tests, types, lint rules, scripts, docs, or agent instructions.
- Keep the compound step lightweight for tiny fixes; for larger work, treat it as part of finishing the task rather than optional cleanup.

## Verification

Use the narrowest command that proves the change, then broaden when contracts cross layers.

Expo app:

```bash
npx tsc --noEmit
npx expo start --dev-client --host lan
```

Nest API:

```bash
cd nest-api && npx tsc --noEmit
cd nest-api && npm run start:dev
```

Vision service:

```bash
cd vision-service && source .venv/bin/activate && python -m compileall app tools
cd vision-service && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Route detection debug loop:

```bash
cd vision-service && source .venv/bin/activate && python tools/run_wall_detection_debug.py
```

When testing on a physical phone, `EXPO_PUBLIC_WALL_API_URL` must point to the Mac's LAN IP, not `localhost`.

## Route Detection Notes

The route detection pipeline is sensitive to photo scale, wall color, lighting, and false positives from tags, screws, floor edges, and volume shadows.

- Keep coordinate systems explicit: photo-space points and viewport-space points are different.
- Check API contracts across Expo, Nest, and FastAPI before renaming fields.
- Use `vision-service/regression_inputs/` for local sample images, but do not commit private gym photos without explicit approval.
- Debug outputs such as `vision-service/debug_outputs*` and Python `__pycache__` directories are generated artifacts and normally should not be committed.
- If adding OpenCV heuristics, capture before/after object counts and inspect overlay images, not just JSON.

## Dependency Discipline

- Do not add mobile native dependencies casually. Expo dev-client/native package changes can require rebuilding iOS.
- If a dependency is added but unused, remove it before finishing unless the user confirms it is intentional.
- Keep server-side computer vision in `vision-service` unless there is a clear product reason to move processing onto the device.

## Style

- TypeScript is strict. Prefer typed request/response boundaries over `any`.
- Prefer names that describe the user's mental model over implementation jargon. Use `Point2D` for generic `{ x, y }` coordinates, `SkeletonEndpointName` for hand/foot endpoint names, `SkeletonControlJointName` for elbow/knee control names, and `SkeletonPointName`/`SkeletonPointMap` for the full set of skeleton points.
- React Native UI should be dense enough for repeated use, avoid oversized marketing-style layouts, and keep controls reachable on mobile.
- Python service code should keep image loading, detection, route selection, and debug artifact writing in separate modules.
- Comments should explain non-obvious heuristics or contracts, not restate code.
