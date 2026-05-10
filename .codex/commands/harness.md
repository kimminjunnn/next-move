Rupa 프로젝트는 Codex Harness를 사용한다. 아래 워크플로우에 따라 작업을 진행하라.

---

## 핵심 원칙

- `AGENTS.md`가 최상위 에이전트 규칙이다.
- `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ADR.md`, `docs/UI_GUIDE.md`를 표준 프로젝트 문서로 사용한다.
- 문서 원문 전체를 phase 파일, step output, 커밋 메시지, 새 문서에 복사하지 않는다.
- 필요한 문서는 로컬에서 직접 읽고, 산출물에는 다음 step에 필요한 짧은 요약만 남긴다.
- 기본 실행은 branch, commit, push를 하지 않는다. 사용자가 명시하거나 CLI 옵션을 준 경우에만 수행한다.

---

## A. 탐색

먼저 아래 파일을 읽고 제품, 아키텍처, 의사결정, UI 방향을 파악한다.

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`

작업이 특정 영역에 걸리면 관련 문서를 추가로 읽는다.

- 로컬 실행: `docs/local-dev-runbook.md`
- route detection: `docs/route-detection-workplan.md`
- skeleton/pose: `docs/skeleton-movement-learning-notes.md`
- 기존 설계/계획: `docs/superpowers/specs/`, `docs/superpowers/plans/`

---

## B. 논의

구현을 위해 구체화하거나 기술적으로 결정해야 할 사항이 있으면 사용자에게 제시하고 논의한다.

단, 이미 승인된 계획이나 명확한 수정 요청이 있으면 바로 phase/step 설계 또는 실행으로 넘어간다.

---

## C. Step 설계

사용자가 구현 계획 작성을 지시하면 여러 step으로 나뉜 초안을 작성해 피드백을 요청한다.

설계 원칙:

1. Scope 최소화: 하나의 step은 하나의 레이어 또는 모듈만 다룬다.
2. 자기완결성: 각 step 파일은 독립된 Codex 세션에서 실행될 수 있어야 한다.
3. 사전 준비 강제: 읽어야 할 문서와 코드 경로를 step 파일에 명시한다.
4. 계약 우선: request/response shape, env var, filesystem input, error semantics를 명확히 쓴다.
5. AC는 실행 가능한 커맨드로 쓴다.
6. 금지사항은 이유와 함께 구체적으로 적는다.
7. step name은 kebab-case slug로 쓴다.

---

## D. 파일 생성

### D-1. `phases/index.json`

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

### D-2. `phases/{task-name}/index.json`

```json
{
  "project": "Rupa",
  "phase": "<task-name>",
  "steps": [
    { "step": 0, "name": "project-setup", "status": "pending" },
    { "step": 1, "name": "core-types", "status": "pending" }
  ]
}
```

상태 전이:

- `pending`: 아직 실행하지 않음
- `completed`: AC 통과, `summary` 필수
- `blocked`: 사용자 개입 필요, `blocked_reason` 필수
- `error`: 실패, `error_message` 필수

### D-3. `phases/{task-name}/step{N}.md`

````markdown
# Step {N}: {name}

## 읽어야 할 파일

- `AGENTS.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `docs/UI_GUIDE.md`
- {이 step에 필요한 코드/문서 경로}

## 작업

{구체적인 작업 지시. owned files, non-goals, interface contract를 포함한다.}

## Acceptance Criteria

```bash
{실행 가능한 검증 명령}
```

## 검증 절차

1. AC 명령을 실행한다.
2. 변경 범위가 이 step의 owned files에 맞는지 확인한다.
3. `phases/{task-name}/index.json`의 해당 step 상태를 업데이트한다.

## 금지사항

- 문서 원문 전체를 새 산출물에 복사하지 마라. 이유: 하네스 산출물에는 필요한 요약만 남긴다.
- 기존 사용자 변경을 되돌리지 마라. 이유: 같은 워크트리에 다른 작업이 있을 수 있다.
````

---

## E. 실행

```bash
python3 scripts/execute.py {task-name}
```

옵션:

```bash
python3 scripts/execute.py {task-name} --model gpt-5.3-codex
python3 scripts/execute.py {task-name} --branch
python3 scripts/execute.py {task-name} --commit
python3 scripts/execute.py {task-name} --commit --push
```

`scripts/execute.py`가 처리하는 것:

- 다음 pending step 탐색
- Codex CLI 비대화 실행
- `AGENTS.md`와 표준 문서 경로 안내
- 완료된 step summary 누적 전달
- 실패 시 최대 3회 재시도
- `started_at`, `completed_at`, `failed_at`, `blocked_at` 타임스탬프 기록
- step output JSON 기록

기본값:

- sandbox: `workspace-write`
- approval: `on-request`
- Codex session: `--ephemeral`
- branch/commit/push: 비활성

