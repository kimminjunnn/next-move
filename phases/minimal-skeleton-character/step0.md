# Step 0: lock-render-contracts

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- `docs/superpowers/specs/2026-05-02-skeleton-pose-overlay-design.md`
- `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`
- `src/components/SkeletonPoseOverlay.tsx`
- `src/components/RupaCharacterLayer.tsx`
- `src/lib/rupaCharacterRig.ts`
- `src/lib/rupaCharacterRig.test.js`
- `src/lib/skeletonCharacterVisibility.js`
- `src/lib/skeletonCharacterVisibility.test.js`
- `src/types/characterRig.ts`
- `src/types/skeletonPose.ts`

## 작업

메인 시뮬레이션의 기본 캐릭터를 PNG 원숭이 리그에서 미니멀 스켈레톤 캐릭터로 바꾸기 전에, 현재 렌더 계약을 테스트로 고정한다.

Owned files:

- `src/lib/rupaCharacterRig.ts`
- `src/lib/rupaCharacterRig.test.js`
- 필요하면 `src/lib/skeletonCharacterVisibility.js`
- 필요하면 `src/lib/skeletonCharacterVisibility.test.js`

구체 작업:

- 기존 `getRupaHeadFacing` 로직을 일반 포즈 기반 helper로 분리할 수 있는지 확인한다.
- 이름을 일반화한다면 기존 export 호환성을 유지한다. 예: `getPoseHeadFacing`를 추가하고 `getRupaHeadFacing`는 wrapper로 남긴다.
- 왼손/왼팔 조작은 `left`, 오른손/오른팔 조작은 `right`, 손 reach 차이가 작으면 `back`인 계약을 테스트로 고정한다.
- 미니멀 캐릭터에서도 재사용할 수 있도록 facing 타입은 `back | left | right` 계약을 유지한다.

인터페이스 계약:

- 스켈레톤 솔버와 `SkeletonPose` 타입은 변경하지 않는다.
- 기존 PNG 리그 variant와 `RUPA_BACK_CHARACTER_VARIANTS`는 삭제하지 않는다.
- `CharacterRigFacing`의 값은 바꾸지 않는다.

Non-goals:

- 새 UI 렌더러를 만들지 않는다.
- PNG 자산을 이동하거나 삭제하지 않는다.
- 시뮬레이션 기본값을 아직 바꾸지 않는다.

## Acceptance Criteria

```bash
node --test src/lib/rupaCharacterRig.test.js src/lib/skeletonCharacterVisibility.test.js
npx tsc --noEmit
```

## 검증 절차

1. AC 명령을 실행한다.
2. 변경 범위가 owned files에 맞는지 확인한다.
3. `phases/minimal-skeleton-character/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
- 기존 PNG 캐릭터 리그를 삭제하지 마라.
