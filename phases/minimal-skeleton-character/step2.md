# Step 2: switch-main-default-keep-lab-rig

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- `app/skeleton-lab.tsx`
- `src/components/SimulationCanvasStage.tsx`
- `src/components/SkeletonPoseOverlay.tsx`
- `src/components/MinimalSkeletonCharacterLayer.tsx`
- `src/components/RupaCharacterLayer.tsx`
- `src/lib/rupaCharacterRig.ts`

## 작업

메인 시뮬레이션에서는 미니멀 스켈레톤 캐릭터를 기본값으로 쓰고, 스켈레톤 랩에서는 기존 PNG 리그 variant를 계속 사용할 수 있게 둔다.

Owned files:

- `src/components/SkeletonPoseOverlay.tsx`
- `src/components/SimulationCanvasStage.tsx`
- `app/skeleton-lab.tsx`
- 필요하면 `src/lib/skeletonCharacterVisibility.js`
- 필요하면 `src/lib/skeletonCharacterVisibility.test.js`

구체 작업:

- `SkeletonPoseOverlay`에 렌더 스타일 prop을 추가한다. 예: `characterRenderStyle?: "minimalSkeleton" | "rupaRig" | "none"`.
- 메인 시뮬레이션의 기본 렌더 스타일은 `"minimalSkeleton"`로 설정한다.
- 스켈레톤 랩은 기존 PNG variant toolbar를 유지한다.
- 스켈레톤 랩에는 미니멀 렌더러를 확인할 수 있는 선택지를 추가해도 된다. 단, 기존 PNG variant 확인 기능을 제거하지 않는다.
- sizing/calibrating 모드에서는 조작점과 뼈대가 충분히 보이게 유지한다.
- simulating 모드에서는 미니멀 캐릭터가 벽 사진과 홀드를 과하게 가리지 않도록 투명도와 선 굵기를 조정한다.

인터페이스 계약:

- 기존 lab route `/skeleton-lab`는 유지한다.
- 기존 undo/redo/reset 동작은 유지한다.
- 기존 `characterParts` prop 기반 PNG 리그는 lab에서 계속 동작해야 한다.

Non-goals:

- PNG 자산을 삭제하거나 이동하지 않는다.
- 홈 화면/설정 화면 브랜드 개편은 하지 않는다.
- Nest API, FastAPI, route detection 계약을 바꾸지 않는다.

## Acceptance Criteria

```bash
node --test src/lib/skeletonCharacterVisibility.test.js
npx tsc --noEmit
```

수동 확인:

- 스켈레톤 랩에서 기존 PNG variant가 계속 보인다.
- 스켈레톤 랩에서 미니멀 스켈레톤 렌더러도 확인 가능하다면 얼굴 방향이 `left/back/right`로 바뀐다.
- 메인 시뮬레이션 화면에서는 기본 오버레이가 PNG 원숭이가 아니라 미니멀 스켈레톤이다.

## 검증 절차

1. AC 명령을 실행한다.
2. 가능한 경우 Expo 앱을 실행해 스켈레톤 랩과 시뮬레이션 화면을 확인한다.
3. 변경 범위가 owned files에 맞는지 확인한다.
4. `phases/minimal-skeleton-character/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
- 스켈레톤 랩의 기존 PNG 리그 확인 기능을 없애지 마라.
