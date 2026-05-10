# Rupa Architecture

## 전체 구조

Rupa는 세 개의 활성 표면을 가진 하나의 제품이다.

- `app/`, `src/`: Expo React Native 모바일 앱
- `nest-api/`: 모바일 요청을 받는 NestJS API
- `vision-service/`: 벽 이미지 분석과 루트 선택을 담당하는 FastAPI/Python 서비스

한 레이어의 변경은 다른 레이어의 계약을 깨뜨릴 수 있다. 특히 벽 사진 분석, 루트 선택, 좌표 변환, 에러 응답은 세 레이어를 함께 확인해야 한다.

## Expo 앱

역할:

- 사용자가 벽 사진을 입력한다.
- 시뮬레이션 화면에서 사진, 스켈레톤, 루트 오버레이를 보여준다.
- 프로필과 신체 모델 정보를 바탕으로 자세 조작을 제공한다.
- Nest API와 통신한다.

주요 위치:

- `app/`: Expo Router 화면
- `src/components/`: 화면 구성 요소와 시뮬레이션 UI
- `src/lib/`: 좌표 변환, 자세 계산, API client, 상태 계산
- `src/store/`: Zustand 기반 앱 상태
- `src/types/`: 레이어 간 공유되는 TypeScript 타입
- `src/theme/`: 브랜드 색상과 시각 규칙

아키텍처 규칙:

- 사진 좌표계와 viewport 좌표계를 명확히 구분한다.
- 좌표 타입은 `{ x, y }` 형태의 `Point2D`를 기본으로 한다.
- 스켈레톤 이름은 사용자/도메인 의미가 드러나도록 유지한다.
- 모바일 UI는 반복 사용에 맞게 밀도 있고 조작 가능해야 한다.

## Nest API

역할:

- Expo 앱의 wall analysis 요청을 받는다.
- 업로드된 이미지를 보관하거나 vision service에 전달 가능한 경로로 관리한다.
- FastAPI vision service와 통신한다.
- 내부 에러를 모바일 앱에 안정적인 에러 계약으로 매핑한다.

주요 위치:

- `nest-api/src/main.ts`
- `nest-api/src/app.module.ts`
- `nest-api/src/modules/vision-client/`
- `nest-api/src/modules/wall-analyses/`

아키텍처 규칙:

- 모바일 앱에 내부 파일 경로나 원시 서비스 에러를 그대로 노출하지 않는다.
- FastAPI 응답 shape를 바꾸면 Expo 타입과 UI 소비 지점을 함께 확인한다.
- `wall-analyses` API의 response field 이름을 안정적으로 유지한다.

## Vision Service

역할:

- 벽 사진을 로드한다.
- OpenCV/Roboflow 기반 이미지 분석을 수행한다.
- 홀드, 볼륨, 윤곽선, 색상, 중심점 등 detected object 정보를 만든다.
- 선택된 시작 홀드를 기준으로 route selection 결과를 계산한다.

주요 위치:

- `vision-service/app/main.py`
- `vision-service/app/routes.py`
- `vision-service/app/schemas.py`
- `vision-service/app/image_loader.py`
- `vision-service/app/roboflow_detection.py`
- `vision-service/app/route_helper.py`
- `vision-service/tools/run_wall_detection_debug.py`

아키텍처 규칙:

- 이미지 로딩, detection, route selection, debug artifact 작성을 분리한다.
- detection 변경은 JSON 개수만 보지 말고 overlay 이미지를 함께 확인한다.
- debug output과 private gym photo는 기본적으로 git에 넣지 않는다.

## 레이어 간 계약

Expo -> Nest:

- `POST /api/v1/wall-analyses`
  - 벽 사진 파일을 받는다.
  - 이미지 메타데이터와 detected objects를 포함한 analysis를 반환한다.
- `POST /api/v1/wall-analyses/:analysisId/route`
  - 시작 홀드 object id를 받는다.
  - route color와 포함 object ids를 반환한다.

Nest -> FastAPI:

- `POST /internal/analyze-wall`
  - `imagePath` 또는 `imageUrl`을 받는다.
- `POST /internal/select-route`
  - `analysisId`, `startHoldObjectId`, detected objects를 받는다.

Detected object 필드는 레이어 전체에서 맞춰야 한다.

- `id`
- `kind`
- `bbox`
- `center`
- `contour`
- `color.hex`
- `parentVolumeObjectId`

## 하네스 구조

Codex Harness는 GitHub의 harness framework 구조를 Rupa에 맞게 이식한 실행 레이어다.

- `.codex/commands/harness.md`: phase/step 설계와 실행 규칙
- `.codex/commands/review.md`: 변경 검토 체크리스트
- `.codex/settings.json`: Codex용 하네스 정책 메모
- `phases/index.json`: phase 상태 목록
- `phases/<phase>/index.json`: step 상태 목록
- `phases/<phase>/stepN.md`: 독립 실행 가능한 step 지시서
- `scripts/execute.py`: Codex step 실행 진입점
- `scripts/codex_harness_execute.py`: 실제 Codex 실행기

하네스는 프로젝트 문서 원문을 산출물에 복사하지 않고, 문서 경로와 짧은 요약만 사용한다.

