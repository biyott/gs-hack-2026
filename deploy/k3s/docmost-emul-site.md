# emul.site(docmost) 404 장애 — 원인 분석과 복구 기록

`gs.emul.site` HTTPS 설정을 위해 Cloudflare SSL 모드를 Full로 변경한 뒤, 기존에 정상이던 `emul.site`(docmost)가 404를 반환하게 된 사건의 전체 진단·복구 과정을 기록한다. 같은 패턴의 장애 재발 시 이 문서 순서대로 확인하면 된다.

## 1. 증상

- `https://gs.emul.site` — 정상
- `https://emul.site`(docmost 문서 도구) — 404
- 변경 사항: Cloudflare SSL/TLS 암호화 모드를 Full로 변경

## 2. 원인

Cloudflare의 SSL/TLS 모드는 **zone 전체에 적용**된다. `gs.emul.site` 때문에 Full 모드로 바꾸는 순간 `emul.site` 요청도 origin의 **443포트(traefik websecure)** 로 본냈다.

그런데 `docmost` Ingress는 다음과 같이 **80포트 전용, host 없음(와일드카드)** 이었다:

```yaml
metadata:
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web   # 80번만
spec:
  rules:
    - http:        # host 미지정 → HOSTS가 "*"로 표시
```

traefik의 websecure(443)에는 `emul.site` 호스트를 받는 라우터가 없었으므로 traefik이 기본 백엔드 404를 반환한 것이다. 이전에는 Cloudflare가 80포트로 본내서(모드가 Flexible 또는 grey cloud) 와일드카드 Ingress에 걸려 정상 동작했다.

참고: `public-domain.md`의 Cloudflare Full (strict) 절에 "다른 서브도메인이 있으면 해당 호스트에 적용되는 설정 규칙을 사용해 그 서비스의 모드를 바꾸지 않는다"는 경고가 바로 이 상황이다.

## 3. 진단 과정 (증거 확보 순서)

### 3.1 k8s 라우팅 규칙 확인

```bash
kubectl get ingress -A
```

결과에서 `docmost` Ingress의 `HOSTS`가 `*`, `PORTS`가 `80`만 있고 TLS가 없음을 확인. `gs-safety-https`는 `80,443`과 전용 host를 가짐.

### 3.2 origin 직접 요청 — k8s 정상 여부 판별 (핵심)

Cloudflare를 거치지 않고 traefik에 직접 Host 헤더만 바꿔 요청:

```bash
curl -vI -H "Host: emul.site" http://10.0.0.124/
```

→ **200 OK** (docmost 응답). k8s/traefik/docmost 라우팅은 정상이므로 원인은 Cloudflare 쪽.

### 3.3 Cloudflare 경유 응답 확인

```bash
curl -vI https://emul.site
```

→ `HTTP/2 404`, `content-type: text/plain`, `content-length: 19`, `x-content-type-options: nosniff`, `server: cloudflare`.

이 헤더 조합은 Go 표준 `http.NotFound`("404 page not found\n", 19바이트) 시그니처다. **traefik과 cloudflared(Cloudflare Tunnel) 둘 다 Go 기반이라 이 둘은 구분이 안 된다.** 따라서 tunnel 여부를 별도로 확인해야 한다.

### 3.4 Cloudflare Tunnel 존재 여부 확인

```bash
kubectl get pods -A | grep -i cloudflare
kubectl get configmap -A | grep -i cloudflare
```

→ 결과 없음. 이 저장소(`deploy/k3s/`)의 설계도 "A 레코드(프록시) → 서버 공인 IP 80/443 → traefik"이므로 tunnel이 아니라는 것이 확인됐다. → **3.3의 404는 traefik의 기본 백엔드 404**로 결론.

## 4. 해결

### 4.1 APP_URL 변경

docmost의 `APP_URL`을 공개 HTTPS URL로 변경 (링크/리다이렉트가 깨지지 않도록):

```yaml
- name: APP_URL
  value: "https://emul.site"
```

```bash
kubectl apply -f docmost-k3s.yaml
kubectl rollout restart deployment/docmost -n docmost
```

### 4.2 TLS 리소스 추가 (docmost-tls.yaml)

`deploy/k3s/docmost-tls.yaml`에 Issuer, Certificate, HTTPS Ingress가 있다. `docmost` 네임스페이스에 적용한다. 기존 HTTP 와일드카드 Ingress는 유지한다(Cloudflare가 HTTP 요청을 80포트로 본낼 때도 동작해야 함).

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: docmost-letsencrypt
  namespace: docmost
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: docmost-acme-account
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
            ingressTemplate:
              metadata:
                annotations:
                  traefik.ingress.kubernetes.io/router.entrypoints: web
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: docmost-tls
  namespace: docmost
spec:
  secretName: docmost-tls
  issuerRef:
    kind: Issuer
    name: docmost-letsencrypt
  dnsNames:
    - emul.site
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: docmost-https
  namespace: docmost
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - emul.site
      secretName: docmost-tls
  rules:
    - host: emul.site
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: docmost
                port:
                  number: 3000
```

### 4.3 적용 및 인증서 발급 대기

```bash
kubectl apply -f docmost-tls.yaml
kubectl -n docmost wait --for=condition=Ready certificate/docmost-tls --timeout=300s
```

### 4.4 검증

```bash
curl --resolve emul.site:443:127.0.0.1 -I https://emul.site   # 서버 직접 → 200
curl -I https://emul.site                                      # Cloudflare 경유 → 200 복구
```

## 5. 인증서 발급 실패 시 확인

```bash
kubectl -n docmost get issuer,certificate,certificaterequest,order,challenge
kubectl -n docmost describe challenge
```

흔한 원인:

- **방화벽** — ACME HTTP-01은 외부에서 `http://emul.site/.well-known/acme-challenge/...`가 서버 80포트에 도달해야 함. 서버/클우드 방화벽에서 80/443 개방 확인.
- **Cloudflare 규칙** — "Always Use HTTPS" 등이 challenge 경로를 443으로 강제하면 실패할 수 있음.

## 6. docmost-k3s.yaml 전체 (백업용)

삭제 후 복구 시 아래 내용을 그대로 붙여넣어 사용한다. `APP_URL`은 이미 `https://emul.site`로 수정된 버전이다.

주의: 이 매니페스트는 `docmost-secrets` Secret(키: `POSTGRES_PASSWORD`, `APP_SECRET`, `DATABASE_URL`)을 참조한다. Secret은 별도로 만들어진 것이므로 이 파일을 다시 적용해 recreate되지 않는다. Secret까지 지웠다면 먼저 다시 생성해야 한다.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: docmost-data
  namespace: docmost
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: docmost
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  namespace: docmost
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: docmost
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:18
          env:
            - name: POSTGRES_DB
              value: docmost
            - name: POSTGRES_USER
              value: docmost
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: docmost-secrets
                  key: POSTGRES_PASSWORD
          ports:
            - containerPort: 5432
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - docmost
                - -d
                - docmost
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 2Gi
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: docmost
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: docmost
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:8
          args:
            - redis-server
            - --appendonly
            - "yes"
            - --maxmemory-policy
            - noeviction
          ports:
            - containerPort: 6379
          readinessProbe:
            exec:
              command:
                - redis-cli
                - ping
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: redis-data
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: docmost
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docmost
  namespace: docmost
spec:
  replicas: 1
  selector:
    matchLabels:
      app: docmost
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: docmost
    spec:
      initContainers:
        - name: wait-for-services
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z postgres 5432; do
                echo "Waiting for PostgreSQL..."
                sleep 2
              done
              until nc -z redis 6379; do
                echo "Waiting for Redis..."
                sleep 2
              done
      containers:
        - name: docmost
          image: docmost/docmost:0.96.0
          env:
            - name: APP_URL
              value: "https://emul.site"
            - name: APP_SECRET
              valueFrom:
                secretKeyRef:
                  name: docmost-secrets
                  key: APP_SECRET
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: docmost-secrets
                  key: DATABASE_URL
            - name: REDIS_URL
              value: "redis://redis:6379"
          ports:
            - name: http
              containerPort: 3000
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 20
            periodSeconds: 10
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 2Gi
          volumeMounts:
            - name: data
              mountPath: /app/data/storage
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: docmost-data
---
apiVersion: v1
kind: Service
metadata:
  name: docmost
  namespace: docmost
spec:
  selector:
    app: docmost
  ports:
    - name: http
      port: 3000
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: docmost
  namespace: docmost
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  ingressClassName: traefik
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: docmost
                port:
                  number: 3000
```

서버에서 복구할 때:

```bash
cat > docmost-k3s.yaml << 'EOF'
# 위 YAML 붙여넣기
EOF
kubectl apply -f docmost-k3s.yaml
```

## 7. 교훈

- **404는 증상일 뿐 어느 레이어에서 났는지 알려주지 않는다.** 요청 경로(브라우저 → DNS → Cloudflare → tunnel/traefik → Service → Pod)의 각 레이어가 다른 주체(Cloudflare 계정 / k8s)에 속하므로, 후보를 한 레이어씩 배제하는 과정이 필요하다.
- **origin 직접 요청**(`curl -H "Host: ..." http://<traefik-ip>/`) 하나로 "k8s가 정상인가"를 확정할 수 있어 가장 먼저 할 가치가 있다.
- kubectl은 k8s 관할만 본다. Cloudflare DNS·SSL 모드·Tunnel 규칙은 kubectl로 조회할 수 없다.
- Cloudflare SSL 모드 변경은 **zone의 모든 호스트에 영향**을 준다. 새 서비스를 HTTPS로 추가할 때 기존 서비스(80포트 전용)가 깨지지 않는지 항상 확인한다.
