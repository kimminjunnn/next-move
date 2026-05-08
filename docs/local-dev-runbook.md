# Rupa Local Dev Runbook

Rupa를 로컬에서 실행할 때 쓰는 최소 절차다.

프로젝트 루트:

```bash
/Users/mj/Dev/Rupa
```

실기기 테스트에서는 `localhost`를 쓰지 않는다. 아이폰의 `localhost`는 맥이 아니라 아이폰 자신을 가리키므로, Expo에는 맥의 현재 LAN IP를 넣어야 한다.

## 0. 맥 IP 확인

Wi-Fi 사용 중이면 보통 아래 명령으로 확인한다.

```bash
ipconfig getifaddr en0
```

값이 없으면 아래도 확인한다.

```bash
ipconfig getifaddr en1
```

예를 들어 결과가 `192.168.0.80`이면 Expo 실행 시 `EXPO_PUBLIC_WALL_API_URL=http://192.168.0.80:3000`으로 맞춘다.

## 1. 최초 세팅

폴더 이름을 바꿨거나 Python 가상환경이 깨졌다면 `vision-service` 가상환경을 다시 만든다.

```bash
cd /Users/mj/Dev/Rupa/vision-service
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Node 의존성이 없으면 루트와 Nest API에서 설치한다.

```bash
cd /Users/mj/Dev/Rupa && npm install
cd /Users/mj/Dev/Rupa/nest-api && npm install
```

## 2. 실행 순서

터미널 1: Vision Service

```bash
cd /Users/mj/Dev/Rupa/vision-service
.venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

```

터미널 2: Nest API

```bash
cd /Users/mj/Dev/Rupa/nest-api
npm run start:dev
```

터미널 3: Expo Dev Client

```bash
cd /Users/mj/Dev/Rupa
EXPO_PUBLIC_WALL_API_URL=http://192.168.45.162:3000 npx expo start --dev-client --host lan
```

`192.168.0.80`은 예시다. 실행 전에는 `ipconfig getifaddr en0` 또는 `ipconfig getifaddr en1`로 확인한 실제 맥 IP로 바꾼다.

## 체크 포인트

- 프로젝트 폴더는 `/Users/mj/Dev/Rupa`다.
- 아이폰과 맥은 같은 Wi-Fi에 연결되어 있어야 한다.
- `vision-service`는 `8000`, `nest-api`는 `3000` 포트에서 떠 있어야 한다.
- Expo는 `EXPO_PUBLIC_WALL_API_URL=http://맥IP:3000` 형태로 실행해야 한다.
- 아이폰에서 API 호출이 안 되면 앱 로그에 찍힌 요청 URL을 먼저 확인한다.
