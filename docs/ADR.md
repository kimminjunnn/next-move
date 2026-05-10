# Architecture Decision Records

## 철학

Rupa는 빠르게 작동하는 최소 제품을 우선한다. 사용자가 벽 사진 위에서 다음 무브를 직접 시험하는 경험에 집중하고, 기록/커뮤니티/AI 정답 추천처럼 핵심 흐름을 흐리는 기능은 뒤로 미룬다. 모바일 native 의존성은 신중히 추가하고, 레이어 간 계약과 좌표계를 명확히 유지한다.

## ADR-001: Expo React Native 앱 구조 선택

결정: 모바일 앱은 Expo React Native와 Expo Router를 사용한다. 화면은 `app/`, 재사용 UI는 `src/components/`, 계산 로직은 `src/lib/`, 상태는 `src/store/`, 타입은 `src/types/`에 둔다.

이유: Rupa의 핵심 경험은 휴대폰에서 벽 사진을 넣고 바로 자세를 시험하는 흐름이다. Expo는 실기기 테스트와 React Native 개발 속도에 유리하고, 현재 코드베이스도 이 구조 위에 있다.

트레이드오프: Expo dev-client와 native package 변경은 빌드 부담을 만든다. 따라서 모바일 native 의존성은 명확한 제품 이유가 있을 때만 추가한다.

## ADR-002: 컴퓨터 비전은 서버 측 vision-service에 둔다

결정: 벽 사진 분석과 루트 탐지는 FastAPI 기반 `vision-service`에서 처리한다. Expo 앱은 사진 입력과 결과 렌더링에 집중하고, Nest API는 모바일 앱과 vision-service 사이의 안정적인 경계가 된다.

이유: 벽 사진 분석은 조명, 벽 색, 볼륨 그림자, 태그, 피스 구멍 같은 변수에 민감하다. 서버에서 OpenCV/Roboflow 기반 분석을 관리하는 편이 디버깅, 검증, 반복 개선에 유리하다.

트레이드오프: 실기기 테스트에서는 맥의 LAN IP와 로컬 서비스 실행 순서를 맞춰야 한다. 오프라인 온디바이스 분석은 V1 범위에서 포기한다.

## ADR-003: 사진 좌표와 화면 좌표를 분리한다

결정: API와 분석 결과는 사진 기준 좌표를 기본으로 다루고, UI 렌더링 직전에 화면 좌표로 변환한다. generic 좌표는 `Point2D`를 쓰고, 스켈레톤/루트 오버레이는 변환 경계를 명확히 둔다.

이유: 시뮬레이션에는 원본 사진 좌표와 확대/이동된 화면 좌표가 동시에 존재한다. 둘이 섞이면 오버레이 정렬, 탭 선택, 자세 조작이 쉽게 어긋난다.

트레이드오프: 변환 함수와 타입이 조금 늘어난다. 대신 좌표 버그를 추적하기 쉬워지고 Expo, Nest API, FastAPI 계약을 안정적으로 유지할 수 있다.

## ADR-004: Codex Harness를 프로젝트 하네스로 사용한다

결정: GitHub의 harness framework 구조를 Rupa에 이식하되, Claude Code 대신 Codex 기준으로 운영한다. `AGENTS.md`를 최상위 규칙으로 두고, `.codex/commands/`, `.codex/skills/`, `phases/`, `scripts/execute.py`를 사용한다.

이유: Rupa 작업은 Expo, Nest API, vision-service, 문서가 함께 움직이는 경우가 많다. phase/step 단위로 쪼개면 범위, 검증, 산출물 관리가 명확해진다.

트레이드오프: 작은 작업에는 파일과 절차가 다소 무겁다. 그래서 단순 수정은 바로 처리하고, 큰 다단계 작업에만 하네스를 쓴다.

## ADR-005: 문서 원문은 하네스 산출물에 복사하지 않는다

결정: 하네스 step과 output에는 문서 경로와 짧은 요약만 남긴다. `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ADR.md`, `docs/UI_GUIDE.md`는 표준 진입 문서로 사용하고, 필요한 세부 문서는 로컬에서 직접 읽는다.

이유: 제품 방향, 로컬 실행 정보, 작업 맥락이 불필요하게 step output이나 새 문서에 퍼지는 것을 막기 위해서다.

트레이드오프: 각 step이 필요한 문서를 다시 읽어야 한다. 대신 산출물이 작고 안전해지며, 다음 step에는 필요한 사실만 전달된다.
