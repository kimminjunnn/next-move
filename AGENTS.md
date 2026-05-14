# AGENTS.md

Rupa 레포에서 작업하는 에이전트 지침이다.

## 프로젝트

Rupa는 실내 볼더링에서 막혔을 때, 사용자가 벽 사진 위에서 자신의 몸 기준으로 다음 무브를 직접 시험해보는 볼더링 시뮬레이터 앱이다. 기록 앱, 커뮤니티 앱, AI 정답 추천 앱이 아니다.

## 기술 스택

- 모바일 앱: Expo React Native, Expo Router, React Native SVG, Zustand
- 앱 언어: TypeScript strict mode
- API: NestJS, TypeScript
- 비전 서비스: FastAPI, Python, OpenCV/YOLO 기반 이미지 분석, Roboflow fallback
- 테스트: Node 기본 테스트 러너, TypeScript/Python 검증
- 하네스: 코덱스 하네스 (`.codex/commands/`, `phases/`, `scripts/execute.py`)

## 프로젝트 구조

- `app/`, `src/`: 사용자용 Expo 앱
- `nest-api/`: 모바일 요청을 받고 지원 서비스와 통신하는 NestJS API
- `vision-service/`: 벽 사진 분석과 루트 탐지를 담당하는 FastAPI 서비스

세 영역은 하나의 제품이다. 한 영역을 바꾸면 다른 영역의 계약도 확인한다.

## 핵심 규칙

- 시작할 때 `git status --short`, 현재 브랜치, 관련 변경 내용을 확인한다.
- 사용자 작업을 보존한다. 명시 요청 없이 되돌리거나 삭제하지 않는다.
- 명시 요청 없이 커밋, 푸시, 풀 리퀘스트 생성을 하지 않는다.
- 작은 변경을 선호하고 기존 구조와 이름을 따른다.
- 한국어 사용자 문구는 자연스럽고 짧게 쓴다.
- 생성물, 디버그 산출물, 비공개 암장 사진은 명시 승인 없이 커밋하지 않는다.

## 아키텍처 규칙

- `app/`, `src/`는 모바일 경험만 담당한다. API나 비전 서비스 책임을 UI에 섞지 않는다.
- `nest-api/`는 앱과 지원 서비스 사이의 안정적인 경계다. 내부 파일 경로나 원시 서비스 에러를 앱에 노출하지 않는다.
- `vision-service/`는 이미지 로딩, 탐지, 루트 선택, 디버그 산출물 작성을 분리한다.
- 명확한 제품 이유 없이 서버 측 비전 로직을 모바일로 옮기지 않는다.
- 사진 좌표와 화면 좌표를 항상 구분한다.
- 루트 탐지 계약을 바꾸면 Expo, Nest API, FastAPI를 함께 확인한다.
- 컴포넌트는 `src/components/`, 계산 로직은 `src/lib/`, 공유 타입은 `src/types/`, 상태는 `src/store/`에 둔다.

## 개발 프로세스

- 기능, 버그 수정, 리팩터링, 동작 변경은 TDD로 진행한다.
- 먼저 실패하는 테스트나 검증을 만들고, 예상 실패를 확인한 뒤 구현한다.
- 개발 작업은 하위 에이전트와 계획 -> 작업 -> 검토 -> 축적 루프를 기본값으로 사용한다.
- 작은 문서 수정이나 단순 읽기 질문은 로컬에서 처리해도 된다.
- 커밋을 요청받으면 관례적 커밋 형식을 따른다.

## 하위 에이전트 주도 개발

- 작업은 분리 가능한 단위로 나누고 파일 소유 범위를 명확히 한다.
- 같은 파일을 여러 하위 에이전트가 동시에 수정하지 않게 한다.
- 하위 에이전트에게 기존 변경을 되돌리지 말라고 명시한다.
- 각 작업 뒤에 계약 일치와 품질을 검토한다.
- 파일 소유 범위:
  - Expo UI: `app/`, `src/components/`, `src/lib/`, `src/store/`, `src/types/`
  - Nest API: `nest-api/src/`
  - 비전 서비스: `vision-service/app/`, `vision-service/tools/`, `vision-service/requirements.txt`
  - 문서: `docs/`, `AGENTS.md`, `.codex/`, `phases/`

## 계획 -> 작업 -> 검토 -> 축적

- 계획: 요구사항, 기존 패턴, 영역 간 계약, TDD 경로, 산출물 범위를 확인한다.
- 작업: 실패 검증을 먼저 만들고 최소 구현 후 검증한다.
- 검토: 요구사항, 타입, 에러 처리, 테스트, 산출물을 확인한다.
- 축적: 반복 교훈은 문서, 테스트, 타입으로 남긴다.

## 코덱스 하네스

- 큰 다단계 작업은 `.codex/commands/harness.md`를 따른다.
- phase는 `phases/<phase-name>/index.json`과 `stepN.md`로 관리한다.
- 실행은 `python3 scripts/execute.py <phase-name>`를 사용한다.
- 문서 원문 전체를 복사하지 않고 경로와 짧은 요약만 사용한다.
- 기본 하네스 실행은 브랜치 생성, 커밋, 푸시를 하지 않는다.

## 명령어

Expo 앱:

```bash
npx tsc --noEmit
npx expo start --dev-client --host lan
```

Nest API:

```bash
cd nest-api && npx tsc --noEmit
cd nest-api && npm run start:dev
```

비전 서비스:

```bash
cd vision-service && source .venv/bin/activate && python -m compileall app tools
cd /Users/mj/Dev/Rupa/vision-service
source .venv/bin/activate
RUPA_WALL_MODEL_PATH=/Users/mj/Dev/rupa-models/hold-seg-v1-colab-plus10/best.pt uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

루트 탐지 디버그:

```bash
cd vision-service && source .venv/bin/activate && python tools/run_wall_detection_debug.py
```

코덱스 하네스:

```bash
python3 scripts/execute.py <phase-name>
```

실기기 테스트에서는 `EXPO_PUBLIC_WALL_API_URL`을 `localhost`가 아니라 맥의 LAN IP로 설정한다.

## 루트 탐지 주의사항

- 사진 크기, 벽 색, 조명, 태그, 피스, 바닥선, 볼륨 그림자가 오탐에 영향을 준다.
- API 필드 `id`, `kind`, `bbox`, `center`, `contour`, `color.hex`, `parentVolumeObjectId`를 레이어 전체에서 맞춘다.
- OpenCV 휴리스틱 변경은 JSON 개수뿐 아니라 덧씌움 이미지도 확인한다.
- `vision-service/debug_outputs*`, `__pycache__`, 비공개 사진은 기본적으로 커밋하지 않는다.

## 스타일

- TypeScript는 엄격하게 쓴다. `any`보다 명시 타입을 선호한다.
- `{ x, y }` 좌표는 `Point2D`를 쓴다.
- 스켈레톤 이름은 `SkeletonEndpointName`, `SkeletonControlJointName`, `SkeletonPointName`, `SkeletonPointMap`을 따른다.
- React Native UI는 밀도 있고 모바일에서 조작 가능해야 한다.
- 주석은 비자명한 휴리스틱과 계약만 설명한다.
