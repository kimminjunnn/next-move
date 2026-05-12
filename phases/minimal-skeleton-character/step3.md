# Step 3: document-visual-pivot-and-verify

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`
- `phases/minimal-skeleton-character/index.json`
- 변경된 Expo UI 파일

## 작업

캐릭터성 중심에서 루트파인딩 도구 중심으로 바뀐 시각 방향을 문서화하고, 기존 PNG 리소스 보관 방침을 명확히 남긴다.

Owned files:

- `docs/UI_GUIDE.md`
- `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`
- 필요하면 `assets/rupa_theme/character/README.md`
- `phases/minimal-skeleton-character/index.json`

구체 작업:

- `docs/UI_GUIDE.md`에서 기본 제품 톤을 “귀여운 원숭이 파트너”에서 “암장에서 빠르게 읽히는 루트파인딩 도구와 미니멀 바디 스켈레톤”으로 조정한다.
- 기존 원숭이/PNG 리그는 삭제 대상이 아니라 lab, legacy, 마스코트, 실험 자산임을 문서화한다.
- 미니멀 스켈레톤 얼굴 방향과 표정 계약을 짧게 적는다.
  - `left/back/right` 방향성 유지.
  - 오묘한 무표정, 호감형, 과장된 감정 표현 금지.
- phase step 상태와 summary를 실제 결과에 맞게 업데이트한다.

인터페이스 계약:

- 문서는 구현 결과와 맞아야 한다.
- 문서에 PRD/ARCHITECTURE 원문을 길게 복사하지 않는다.
- private 사진, 디버그 산출물, 임시 생성물은 추가하지 않는다.

Non-goals:

- 새 앱 이름 변경 작업을 이 step에서 하지 않는다.
- 새 에셋 생성 프롬프트나 이미지 생성 작업을 하지 않는다.
- API/vision-service 문서를 바꾸지 않는다.

## Acceptance Criteria

```bash
npm test
npx tsc --noEmit
git diff --check
```

수동 확인:

- 메인 시뮬레이션 기본 오버레이가 미니멀 스켈레톤인지 확인한다.
- 스켈레톤 랩에서 기존 PNG 리그를 계속 볼 수 있는지 확인한다.
- 얼굴 방향과 표정이 벽 사진 판독을 방해하지 않는지 확인한다.

## 검증 절차

1. AC 명령을 실행한다.
2. 수동 확인 결과를 step summary에 짧게 남긴다.
3. 변경 범위가 owned files에 맞는지 확인한다.
4. `phases/minimal-skeleton-character/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
- 생성물, 디버그 산출물, 비공개 암장 사진을 추가하지 마라.
