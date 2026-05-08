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

## 다음에 볼 순서

2. `src/lib/bodyModel.ts`
   - 키, 윙스팬, scale로 팔/다리/몸통 길이가 어떻게 만들어지는지 본다.

3. `src/lib/skeletonPoseSolver.ts`
   - 실제 움직임 계산이 어디서 일어나는지 본다.
   - 먼저 `createDefaultSkeletonPose()`를 본다.
   - 그 다음 `solveTwoBoneJoint()`를 본다.

4. `src/components/SkeletonPoseOverlay.tsx`
   - 사용자의 드래그 입력이 어떻게 움직임 계산기로 전달되는지 본다.

5. `src/components/SimulationCanvasStage.tsx`
   - 실제 시뮬레이션 화면에서 스켈레톤이 언제 뜨고 어떻게 연결되는지 본다.

## 현재 위치

현재는 1번을 끝냈고, 다음은 2번 `src/lib/bodyModel.ts`를 볼 차례다.
