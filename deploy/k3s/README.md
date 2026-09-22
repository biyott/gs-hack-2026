# 단일 K3s 서버 수동 배포

이미 배포된 앱을 `gs.emul.site`로 공개하려면 [도메인·HTTPS 연결](public-domain.md)을 따르세요.

서버에서 이미지를 빌드하고 K3s에 직접 넣습니다. GitHub Actions, 레지스트리, Argo CD는 필요하지 않습니다. **K3s 노드가 1대이고 Docker가 설치된 Linux 서버**에서 실행하세요. AMD64/ARM64 모두 서버 CPU에 맞춰 빌드합니다. 첫 빌드에는 npm 패키지와 임베딩 모델 다운로드를 위한 인터넷 연결이 필요합니다.

Ubuntu/Debian 서버에 Docker가 없다면 `sudo apt-get update` 후 `sudo apt-get install -y docker.io`와 `sudo systemctl enable --now docker`로 준비할 수 있습니다. 기존 K3s의 `local-path` StorageClass를 사용하며 클러스터를 새로 설치하거나 기존 앱을 변경하지 않습니다.

## 처음 배포

```bash
git clone https://github.com/biyott/gs-hack-2026.git
cd gs-hack-2026
mkdir -p "$HOME/.config/gs-safety"
chmod 700 "$HOME/.config/gs-safety"
touch "$HOME/.config/gs-safety/server.env"
chmod 600 "$HOME/.config/gs-safety/server.env"
nano "$HOME/.config/gs-safety/server.env"
```

파일에는 실제 값으로 아래 **두 줄**을 넣습니다. 따옴표나 `export`를 붙이지 않습니다. PIN은 4–128자입니다. 파일을 Git에 추가하지 마세요.

```dotenv
OPENAI_API_KEY=실제_API_키
GS_DEMO_PIN=본인이_정한_접속_PIN
```

```bash
sudo bash deploy/k3s/deploy.sh "$HOME/.config/gs-safety/server.env"
```

스크립트가 이미지 빌드 → K3s 이미지 가져오기 → Secret/PVC/앱 적용 → 준비 상태 대기를 수행합니다. SQLite 마이그레이션과 데모 계정 생성은 앱이 자동 처리합니다. GPT 선택 모델은 기본 `gpt-4.1-mini-2025-04-14`이며, 검색용 multilingual E5 모델은 이미지에 포함됩니다. 별도 로컬 Qwen 서버는 필요 없습니다.

## 접속과 확인

`http://서버_IP:30080`을 엽니다. 서버와 휴대폰이 같은 Tailscale 네트워크에 있으면 `http://서버_Tailscale_IP:30080`으로 접속할 수 있습니다. **같은 Wi-Fi일 필요는 없습니다.** Tailscale 주소는 서버에서 `tailscale ip -4`로 확인합니다. NodePort는 서버 네트워크 인터페이스에 열리므로 클라우드 방화벽에서 공개 인터넷에 30080을 열 필요 없이 Tailscale 연결부터 사용하세요.

현재 로그인 쿠키는 HTTP에서도 동작합니다. 브라우저 카메라 등 보안 컨텍스트가 필요한 기능은 HTTPS 주소를 사용해야 합니다. 필요하면 기존 HTTPS 프록시 또는 Tailscale Serve로 이 포트를 연결하세요. 프록시는 원래 Host와 `X-Forwarded-Proto`를 유지해야 하며, 적용 후 로그인 요청과 실시간 SSE가 정상인지 확인하세요.

```bash
sudo k3s kubectl -n gs-safety get pods,pvc,svc
sudo k3s kubectl -n gs-safety logs deployment/gs-safety --tail=80
```

관리자 계정 `admin`과 설정한 PIN으로 로그인하고, 시뮬레이션 실행과 휴대폰 연결을 확인하세요. 준비 상태 검사는 웹 서버 응답만 확인하므로 GPT 응답은 실제 시뮬레이션에서 따로 확인해야 합니다.

## 수정 후 다시 배포

```bash
cd gs-hack-2026
git pull --ff-only
sudo bash deploy/k3s/deploy.sh "$HOME/.config/gs-safety/server.env"
```

환경변수만 바꿨을 때도 같은 명령을 사용합니다. 매번 새 이미지 태그로 Pod를 교체하므로 Secret 변경도 반영됩니다. PVC와 SQLite/WAL 파일은 유지됩니다. 앱은 한 Pod만 실행하며 교체 중 잠깐 끊기고 실행 중인 시뮬레이션은 다시 시작해야 합니다. K3s의 `local-path` 데이터는 해당 서버 디스크에 있으므로 별도 백업이 필요하며 PVC/네임스페이스를 삭제하면 안 됩니다. 이전 이미지 자동 삭제는 하지 않습니다.

배포 실패 시 위 로그와 `sudo k3s kubectl -n gs-safety describe pod`를 확인하세요. 이 구성은 단일 노드용이므로 노드가 여러 대면 스크립트가 배포 전에 중단합니다.
