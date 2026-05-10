# 스켈레톤 움직임 이해 순서

목표: 스켈레톤 움직임 코드를 이해해서, 나중에 직접 고치거나 AI에게 정확히 개선을 지시할 수 있게 된다.

## 지금까지 한 것

1. `src/types/skeletonPose.ts`
   - 스켈레톤 타입을 읽었다.
   - 타입 관련 변수명을 이해했다.
   - 이해하기 쉽게 이름을 재정의했다.
   - `SimulationPoint` -> `Point2D`
   - `SkeletonEndpointId` -> `SkeletonEndpointName`
   - `SkeletonControlJointId` -> `SkeletonControlJointName`
   - `SkeletonJointId` -> `SkeletonLandmarkName`
   - `SkeletonJointMap` -> `SkeletonLandmarkMap`

2. `src/lib/bodyModel.ts`
   - 키, 윙스팬, scale로 화면용 신체 길이 모델을 만드는 흐름을 이해했다.
   - `cmToViewportPoints()`가 cm 단위를 화면 좌표 길이로 바꾸는 함수임을 이해했다.
   - `oneSideReach`가 `(윙스팬 - 어깨폭) / 2`로 계산되는 한쪽 팔 리치임을 이해했다.
   - 팔/다리 비율 상수를 export해서 테스트에서 import하도록 정리했다.
   - 어깨폭/골반폭을 남녀 평균값 기반 비율로 맞췄다.
   - `clampNumber()`를 공용 유틸 `src/lib/number.ts`로 분리했다.

3. `src/lib/bodyModel.test.js`
   - Node 기본 테스트 러너의 `test`, `assert.ok`, `assert.equal` 의미를 확인했다.
   - 윙스팬 기반 팔 길이 계산 테스트를 이해했다.
   - 키 기반 다리/비팔 부위 계산 테스트를 이해했다.
   - 스켈레톤 scale 범위 제한 테스트를 추가했다.

4. `src/lib/skeletonPoseSolver.ts`
   - 파일명이 “스켈레톤 자세를 계산해서 풀어내는 모듈”이라는 뜻임을 이해했다.
   - 튜닝 상수들은 지금 당장 분리하지 않고, solver 흐름을 더 이해한 뒤 그룹화하기로 했다.
   - `SKELETON_JOINT_IDS`를 `SKELETON_LANDMARK_NAMES`로 바꿨다.
   - `SKELETON_LANDMARK_NAMES`가 `SkeletonLandmarkName` 타입을 만족하는지 검사하게 했다.
   - landmark 위치를 보기 위한 그림 `docs/skeleton-landmarks.svg`를 만들었다.
   - `add`, `subtract`, `scaleVector`, `distance`, `midpoint` 같은 기본 좌표 계산 함수의 역할을 확인했다.
   - `smoothStep()`은 0..1 반응값을 부드럽게 만들어 몸통 따라감이 튀지 않게 하는 함수임을 이해했다.
   - `clampDistance()`는 방향은 유지하되, 최대 거리보다 멀면 가능한 거리 안으로 끌어오는 함수임을 이해했다.

## 다음에 볼 순서

5. `src/lib/skeletonPoseSolver.ts`
   - `limitPointStep()`과 `resolveEndpointDistance()`를 더 정확히 이해한다.
   - 그 다음 `solveTwoBoneJoint()`를 본다.
   - 이후 `createDefaultSkeletonPose()`를 본다.

6. `src/components/SkeletonPoseOverlay.tsx`
   - 사용자의 드래그 입력이 어떻게 움직임 계산기로 전달되는지 본다.

7. `src/components/SimulationCanvasStage.tsx`
   - 실제 시뮬레이션 화면에서 스켈레톤이 언제 뜨고 어떻게 연결되는지 본다.

## 현재 위치

현재는 `skeletonPoseSolver.ts`의 기본 좌표 계산 함수들을 보는 중이다.

다음은 `limitPointStep()`, `resolveEndpointDistance()`, `solveTwoBoneJoint()`를 차례대로 이해할 차례다.
