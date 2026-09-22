# gs.emul.site 외부 시연 연결

이미 실행 중인 단일 k3s 서버의 `gs-safety` Service(3000번 포트)에 기본 Traefik을 연결한다. 앱 이미지나 SQLite PVC를 교체하지 않는다. 이 문서는 도메인 연결용이며 최신 앱 코드 반영에는 별도 이미지 재배포가 필요하다.

## 1. 서비스와 HTTP 연결

DNS의 `gs.emul.site`가 서버 공인 IP를 가리켜야 한다. 서버/클라우드 방화벽에서 TCP 80과 443을 허용한다. 기존 NodePort 30080은 도메인 연결에 사용하지 않는다.

```bash
sudo k3s kubectl -n kube-system get deployment/traefik service/traefik
sudo k3s kubectl -n gs-safety get deployment/gs-safety service/gs-safety
sudo k3s kubectl apply -f deploy/k3s/domain-http.yaml
curl -I -H 'Host: gs.emul.site' http://127.0.0.1
curl -I http://gs.emul.site
```

## 2. 인증서 관리 도구

기존 cert-manager가 있으면 다시 설치하지 않는다. 아래 버전은 Kubernetes 1.33–1.36을 지원하므로 `sudo k3s kubectl version`으로 먼저 확인한다. [공식 설치](https://cert-manager.io/docs/installation/kubectl/), [지원 버전](https://cert-manager.io/docs/releases/)

```bash
sudo k3s kubectl get pods -n cert-manager
sudo k3s kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.21.2/cert-manager.yaml
sudo k3s kubectl -n cert-manager rollout status deployment/cert-manager --timeout=180s
sudo k3s kubectl -n cert-manager rollout status deployment/cert-manager-webhook --timeout=180s
sudo k3s kubectl -n cert-manager rollout status deployment/cert-manager-cainjector --timeout=180s
```

## 3. 서버 HTTPS 연결

```bash
sudo k3s kubectl apply -f deploy/k3s/domain-https.yaml
sudo k3s kubectl -n gs-safety wait --for=condition=Ready certificate/gs-safety-tls --timeout=300s
curl --resolve gs.emul.site:443:127.0.0.1 -I https://gs.emul.site
```

마지막 명령은 Cloudflare를 거치지 않고 서버의 인증서를 검증한다. 인증서 준비에 실패하면 아래 상태를 확인한다. Secret 내용이나 개인 키는 출력하지 않는다.

```bash
sudo k3s kubectl -n gs-safety get issuer,certificate,certificaterequest,order,challenge
sudo k3s kubectl -n gs-safety describe certificate gs-safety-tls
sudo k3s kubectl -n gs-safety describe challenge
```

## 4. Cloudflare를 사용하는 경우

서버 인증서 확인 후 Cloudflare의 해당 도메인 설정에서 **SSL/TLS → 암호화 모드 → Full (strict)**를 선택한다. Flexible에서는 브라우저가 HTTPS여도 서버 구간이 HTTP라 앱의 동일 출처 검사에서 `ORIGIN_DENIED`가 발생할 수 있다. 다른 서브도메인이 있으면 해당 호스트에 적용되는 설정 규칙을 사용해 그 서비스의 모드를 바꾸지 않는다. [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)

```bash
curl -I https://gs.emul.site
curl -sS -X POST https://gs.emul.site/api/session \
  -H 'Origin: https://gs.emul.site' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

두 번째 요청은 로그인 정보를 보내지 않는 출처 검사다. `INVALID_INPUT`이면 출처 검사를 통과했고, `ORIGIN_DENIED`이면 프록시의 HTTPS 전달을 더 확인해야 한다. 실제 로그인 성공 검사는 별도로 수행한다.

## 5. 시연 접속

브라우저는 `https://gs.emul.site`로 접속한다. 앱의 실행·응답 버튼은 보안 컨텍스트가 필요한 `crypto.randomUUID()`를 사용하므로 공개 HTTP 주소로 시연하지 않는다. [Web Crypto 표준](https://w3c.github.io/webcrypto/#Crypto-method-randomUUID)

Android 앱 세 대 모두 서버 선택을 **수동 입력 → `https://gs.emul.site`**로 맞추고 다시 연결한다. 공개 도메인 연결에는 같은 Wi-Fi나 Tailscale 접속이 필요하지 않다. 실제 접속 PIN으로 로그인한 뒤 명령 전송과 실시간 갱신을 확인한다. 서버를 재배포했다면 고정 UWB 기준점을 다시 적용한다.
