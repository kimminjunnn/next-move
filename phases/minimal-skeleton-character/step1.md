# Step 1: add-minimal-skeleton-renderer

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
- `src/components/RiggedImagePart.tsx`
- `src/lib/rupaCharacterRig.ts`
- `src/types/skeletonPose.ts`
- `src/types/characterRig.ts`

## 작업

PNG 없이 `react-native-svg`로 그리는 미니멀 스켈레톤 캐릭터 렌더러를 추가한다. 기존 스켈레톤 포즈/몸 모델을 입력으로 받아, 벽 사진을 덜 가리는 얇은 인체 가이드처럼 보여야 한다.

Owned files:

- `src/components/MinimalSkeletonCharacterLayer.tsx`
- 필요하면 `src/components/SkeletonPoseOverlay.tsx`
- 필요하면 `src/lib/rupaCharacterRig.ts`

구체 작업:

- `MinimalSkeletonCharacterLayer`를 새로 만든다.
- props는 최소한 `pose`, `bodyModel`, `activeControlId`, `visible`, `opacity`를 받게 한다.
- 몸은 얇은 라운드 라인과 작은 관절점 중심으로 그린다.
- 머리는 원형으로 그리고, 얼굴 방향은 기존 `back | left | right` helper를 재사용한다.
- 표정은 오묘한 무표정이면서 호감형이어야 한다.
  - `back`: 뒤통수 중앙선 또는 부드러운 세로 곡선.
  - `left`: 작은 눈 하나, 짧은 코/입 라인. 과장된 웃음 금지.
  - `right`: left의 반대 방향.
  - 얼굴 요소는 얇고 작게 그려서 벽 사진과 홀드를 가리지 않는다.
- 색상은 사진 위 판독성을 우선한다. 밝은 반투명 fill, 어두운 outline, 선택 강조색 정도로 제한한다.
- `pointerEvents="none"` 계약을 유지한다.

인터페이스 계약:

- 새 렌더러는 제스처를 소유하지 않는다.
- `SkeletonPoseOverlay`의 기존 hit area와 drag responder는 그대로 유지한다.
- PNG 캐릭터 리그와 같은 `SkeletonPose`를 소비한다.

Non-goals:

- 새 PNG를 생성하지 않는다.
- 원숭이 PNG 리그를 삭제하거나 archive로 이동하지 않는다.
- 솔버, 히스토리, 좌표 변환, API 계약을 바꾸지 않는다.

## Acceptance Criteria

```bash
npx tsc --noEmit
```

## 검증 절차

1. AC 명령을 실행한다.
2. 변경 범위가 owned files에 맞는지 확인한다.
3. `phases/minimal-skeleton-character/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
- 새 bitmap 캐릭터 자산을 추가하지 마라.
