# Lightsail Deployment

Rupa can start on one Lightsail Ubuntu instance with Docker Compose.

The deployment runs:

- `nest-api`: public API entrypoint for the Expo app
- `vision-service`: internal FastAPI service for YOLO wall analysis
- `best.pt`: model file mounted from the server disk

## 1. Create The Instance

In AWS Lightsail:

- Platform: Linux/Unix
- Blueprint: Ubuntu
- Size: start with 2GB RAM for a cost test, use 4GB RAM if YOLO is slow or unstable
- Region: choose the closest region available for your users

Open only the ports you need:

- `22`: SSH
- `3000`: temporary API testing by IP

Later, use HTTPS on `80` and `443` with a domain and close public `3000`.

## 2. Install Docker

SSH into the instance, then run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and SSH back in so the Docker group applies.

## 3. Upload The Model

On the server:

```bash
sudo mkdir -p /opt/rupa/models
sudo chown -R "$USER":"$USER" /opt/rupa
```

From your Mac:

```bash
scp /Users/mj/Dev/rupa-models/hold-seg-v1-colab-plus10/best.pt ubuntu@SERVER_IP:/opt/rupa/models/best.pt
```

Do not commit model files to git.

## 4. Upload The App

The simplest first deployment is to clone the repository on the server:

```bash
git clone YOUR_REPO_URL Rupa
cd Rupa
cp .env.deploy.example .env
```

Check `.env`:

```bash
RUPA_MODEL_DIR=/opt/rupa/models
NEST_API_PORT=3000
```

## 5. Start The Services

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f nest-api
docker compose logs -f vision-service
```

## 6. Verify The API

Health checks:

```bash
curl -sS http://127.0.0.1:3000/health
curl -sS http://127.0.0.1:8000/health
```

From your Mac, while port `3000` is temporarily open:

```bash
curl -sS -w '\nHTTP_STATUS:%{http_code}\n' \
  -F file=@vision-service/regression_inputs/wall_photos_raw/wall_001.jpeg \
  http://SERVER_IP:3000/api/v1/wall-analyses
```

Expected: `HTTP_STATUS:201`.

## 7. Expo API URL

For a temporary IP-based test:

```bash
EXPO_PUBLIC_WALL_API_URL=http://SERVER_IP:3000 npx expo start --dev-client --host lan
```

For production app builds, use an HTTPS API URL instead of an IP address.

## Next Step

After IP-based testing works, add a domain and HTTPS proxy, then stop exposing port `3000` publicly.
