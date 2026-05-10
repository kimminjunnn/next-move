# Step 0: preserve-current-assets

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- `docs/superpowers/specs/2026-05-10-rupa-rigged-character-design.md`

## 작업

현재 active 2D 캐릭터 PNG를 `assets/rupa_theme/character/back-v3-2d/`에 보존한다.
기존 `back-v1-procedural/`, `back-v2-plush-3d/`는 수정하지 않는다.

## Acceptance Criteria

```bash
file assets/rupa_theme/character/back-v3-2d/*.png
```

## 검증 절차

1. AC 명령을 실행한다.
2. `phases/rupa-rig-friendly-assets/index.json`의 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
