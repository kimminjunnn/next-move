# Step 2: verify-and-document

## 읽어야 할 파일

- `AGENTS.md`
- `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`
- `phases/rupa-rig-friendly-assets/index.json`

## 작업

검증 결과와 새 rollback point를 문서화한다.

계약:

- 새 active pass는 `back-v4-rig-friendly/` 기반임을 기록한다.
- `back-v1-procedural/`, `back-v2-plush-3d/`, `back-v3-2d/`의 의미를 짧게 기록한다.
- Simulator 실기 확인이 남아 있으면 residual risk로 남긴다.

## Acceptance Criteria

```bash
npm test
npx tsc --noEmit
git diff --check
```

## 검증 절차

1. AC 명령을 실행한다.
2. 문서가 원문 전체 복사가 아니라 짧은 요약인지 확인한다.
3. `phases/rupa-rig-friendly-assets/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
