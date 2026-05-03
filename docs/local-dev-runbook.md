# Local Dev Runbook

이 문서는 현재 앱을 로컬 개발 환경에서 실행할 때 필요한 서버와 Expo dev client 실행 순서를 정리한 문서다.

실기기 테스트일 때는 `localhost`를 쓰면 안 된다. 아이폰에서 보는 `localhost`는 맥이 아니라 아이폰 자기 자신이기 때문이다.  
그래서 Expo 실행 시 `EXPO_PUBLIC_WALL_API_URL`에는 반드시 `맥의 현재 LAN IP`를 넣어야 한다.

## 0. 맥 IP 확인

보통 Wi-Fi를 쓰고 있으면 아래 명령으로 현재 맥 IP를 확인할 수 있다.

```bash
ipconfig getifaddr en0
```

만약 아무 값도 안 나오면 아래도 확인한다.

```bash
ipconfig getifaddr en1
```

예를 들어 결과가 `192.168.0.80`이면, Expo 실행 명령의 `EXPO_PUBLIC_WALL_API_URL`도 `http://192.168.0.80:3000`으로 맞춘다.

## 1. Vision Service

```bash
cd /Users/mj/Dev/next-move/vision-service && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 2. Nest API

```bash
cd /Users/mj/Dev/next-move/nest-api && npm run start:dev
```

## 3. Expo Dev Client

```bash
cd /Users/mj/Dev/next-move && EXPO_PUBLIC_WALL_API_URL=http://172.30.1.83:3000 npx expo start --dev-client --host lan
```

`192.168.0.80`는 예시다. 실제 실행 전에는 위의 IP 확인 명령으로 현재 맥 IP를 먼저 확인하고 바꿔서 실행한다.

## 체크 포인트

- 아이폰과 맥은 같은 Wi-Fi에 연결되어 있어야 한다.
- `vision-service`는 `8000`, `nest-api`는 `3000` 포트에서 떠 있어야 한다.
- Expo는 `EXPO_PUBLIC_WALL_API_URL=http://맥IP:3000` 형태로 실행해야 한다.
- 아이폰에서 API 호출이 안 되면 먼저 앱 로그에 어떤 URL이 찍히는지 확인한다.
