---
name: rupa-harness
description: Rupa 전용 Codex Harness 워크플로우. 사용자가 phase/step 기반 작업 계획, 하네스 실행, `phases/` 파일 생성, `.codex/commands/harness.md` 적용, 큰 다단계 구현 작업 분해를 요청할 때 사용한다.
---

# Rupa Harness

Rupa의 큰 작업을 독립 실행 가능한 phase/step으로 나누고 `scripts/execute.py`로 실행하게 만드는 스킬이다.

## 핵심 원칙

- 먼저 `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ADR.md`, `docs/UI_GUIDE.md`를 읽는다.
- 작업 영역이 명확하면 관련 문서만 추가로 읽는다:
  - 로컬 실행: `docs/local-dev-runbook.md`
  - 루트 탐지: `docs/route-detection-workplan.md`
  - 스켈레톤/자세: `docs/skeleton-movement-learning-notes.md`
  - 기존 설계/계획: `docs/superpowers/specs/`, `docs/superpowers/plans/`
- 문서 원문 전체를 phase 파일, step output, 커밋 메시지, 새 문서에 복사하지 않는다.
- 산출물에는 다음 step에 필요한 짧은 요약만 남긴다.
- 기본 실행은 브랜치 생성, 커밋, 푸시를 하지 않는다.

## 작업 흐름

1. 현재 변경사항과 관련 문서를 확인한다.
2. 작업을 레이어나 모듈 단위의 작은 step으로 나눈다.
3. 각 step에 읽어야 할 파일, owned files, non-goals, 인터페이스 계약, 검증 명령을 적는다.
4. `phases/index.json`, `phases/<phase>/index.json`, `phases/<phase>/stepN.md`를 만든다.
5. 실행 요청이 있으면 `python3 scripts/execute.py <phase-name>`을 사용한다.

## Phase 파일 형식

`phases/index.json`:

```json
{
  "phases": [
    {
      "dir": "0-example",
      "status": "pending"
    }
  ]
}
```

`phases/<phase>/index.json`:

```json
{
  "project": "Rupa",
  "phase": "<phase>",
  "steps": [
    { "step": 0, "name": "first-step", "status": "pending" }
  ]
}
```

`phases/<phase>/step0.md`:

````markdown
# Step 0: first-step

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- {작업에 필요한 파일}

## 작업

{구체적인 작업 지시. owned files, non-goals, 인터페이스 계약을 포함한다.}

## Acceptance Criteria

```bash
{실행 가능한 검증 명령}
```

## 검증 절차

1. AC 명령을 실행한다.
2. 변경 범위가 owned files에 맞는지 확인한다.
3. `phases/<phase>/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라.
- 기존 사용자 변경을 되돌리지 마라.
````

## 실행

```bash
python3 scripts/execute.py <phase-name>
python3 scripts/execute.py <phase-name> --model gpt-5.3-codex
python3 scripts/execute.py <phase-name> --branch
python3 scripts/execute.py <phase-name> --commit
python3 scripts/execute.py <phase-name> --commit --push
```

기본값은 `workspace-write`, `on-request`, `--ephemeral`이다.

