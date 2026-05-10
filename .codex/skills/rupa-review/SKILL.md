---
name: rupa-review
description: Rupa 변경사항 리뷰 스킬. 사용자가 리뷰, 코드 리뷰, 하네스 step 검토, PR 전 점검, 변경사항 품질 확인을 요청할 때 제품/아키텍처/테스트/산출물 기준으로 검토한다.
---

# Rupa Review

Rupa 변경사항을 제품 범위, 세 레이어 아키텍처, 테스트, 산출물 관리 기준으로 검토한다.

## 읽을 문서

먼저 다음 문서를 읽는다.

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`

작업 영역에 따라 추가로 읽는다.

- 루트 탐지: `docs/route-detection-workplan.md`
- 스켈레톤/자세: `docs/skeleton-movement-learning-notes.md`
- 하네스 작업: `.codex/commands/harness.md`, `phases/<phase>/`

## 검토 기준

- 제품 적합성: Rupa의 “벽 사진 위에서 다음 무브를 직접 시험”하는 범위를 벗어나지 않았는가.
- 아키텍처: Expo, Nest API, FastAPI 책임이 섞이지 않았는가.
- 계약: 루트 탐지 request/response field가 세 레이어에서 맞는가.
- 좌표계: 사진 좌표와 화면 좌표가 섞이지 않았는가.
- 테스트: 변경 위험에 맞는 테스트나 검증이 있는가.
- 산출물: debug output, private photo, pycache, step output이 커밋 대상에서 빠졌는가.
- UI: 한국어 문구, Rupa 톤, 모바일 조작성을 지키는가.
- 사용자 변경: 관련 없는 기존 변경을 되돌리지 않았는가.

## 출력 형식

문제가 있으면 findings를 먼저 쓴다.

```markdown
## Findings

- P1/P2/P3: `파일:라인` 문제와 영향

## Open Questions

- 필요한 질문

## Summary

- 변경 요약

## Verification

- 실행한 명령과 결과
```

문제가 없으면 “발견한 blocking issue 없음”이라고 명확히 쓰고 남은 검증 공백을 짧게 적는다.

