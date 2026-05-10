# Step 1: generate-rig-friendly-assets

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- `scripts/generate_rupa_character_parts.mjs`
- `src/lib/rupaCharacterRig.ts`
- `src/lib/rupaCharacterRig.test.js`
- `scripts/character_asset_scripts.test.mjs`

## 작업

초기 절차형 PNG의 자연스러운 리깅 구조를 기반으로 새 `back-v4-rig-friendly/` 에셋을 만든다.

계약:

- 현재 active 2D는 `back-v3-2d/`에 보존한다.
- `back-v1-procedural/` 원본은 덮어쓰지 않는다.
- 새 기본 생성 출력은 `back-v4-rig-friendly/`로 둔다.
- 손/발은 뒤에서 보는 손등/발등처럼 읽히도록 단순화한다.
- 팔/다리는 절단면이 드러나는 2D 시트 대신 초기 리깅 친화 캡슐형 파츠를 사용한다.
- active `back/`에는 새 body/limb/hand/foot/tail/chalk-bag 파츠를 반영하되, 현재 2D head variant는 유지한다.
- rig manifest의 `nativeSize`는 active PNG 크기와 일치해야 한다.

## Acceptance Criteria

```bash
npm test
npx tsc --noEmit
git diff --check
file assets/rupa_theme/character/back/*.png assets/rupa_theme/character/back-v4-rig-friendly/*.png
```

## 검증 절차

1. AC 명령을 실행한다.
2. 변경 범위가 이 step의 owned files에 맞는지 확인한다.
3. `phases/rupa-rig-friendly-assets/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- `back-v1-procedural/`, `back-v2-plush-3d/`, `back-v3-2d/`를 덮어쓰지 마라.
- 기존 사용자 변경을 되돌리지 마라.
