#!/usr/bin/env bash
set -euo pipefail

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# -eq 1 && "$1" = /* ]] || fail 'Usage: sudo bash deploy/k3s/deploy.sh /absolute/path/server.env'
[[ $EUID -eq 0 ]] || fail 'Run with sudo on the single K3s server.'
for command in docker k3s git realpath stat awk sed date; do
  command -v "$command" >/dev/null || fail "Missing command: $command"
done
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$(realpath -- "$1")"
[[ -f "$env_file" && -r "$env_file" ]] || fail 'The environment file must be readable.'
[[ "$env_file" != "$repo_dir"/* ]] || fail 'Keep server.env outside the repository.'
env_mode="$(stat -c '%a' -- "$env_file")"
(( (8#$env_mode & 077) == 0 )) || fail 'Protect server.env with chmod 600.'
awk '
  /^[[:space:]]*($|#)/ { next }
  {
    separator = index($0, "=")
    key = substr($0, 1, separator - 1)
    value = substr($0, separator + 1)
    if (!separator || value ~ /\r/ || seen[key]++) exit 1
    if (key == "OPENAI_API_KEY" && value ~ /[^[:space:]]/) api = 1
    else if (key == "GS_DEMO_PIN" && length(value) >= 4 && length(value) <= 128) pin = 1
    else exit 1
  }
  END { if (!api || !pin) exit 1 }
' "$env_file" || fail 'server.env needs exactly OPENAI_API_KEY and GS_DEMO_PIN (4–128 characters), without quotes/export or duplicates.'
[[ -f /etc/rancher/k3s/k3s.yaml ]] || fail 'Run on the K3s server with /etc/rancher/k3s/k3s.yaml.'
kubectl_local() { k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml "$@"; }
docker info >/dev/null
k3s ctr --namespace k8s.io images list >/dev/null
nodes="$(kubectl_local get nodes -o name)"
[[ -n "$nodes" && "$nodes" != *$'\n'* ]] || fail 'This script supports exactly one K3s node (local image and SQLite storage).'
node_name="${nodes#node/}"
node_ready="$(kubectl_local get "$nodes" -o 'jsonpath={.status.conditions[?(@.type=="Ready")].status}')"
[[ "$node_ready" == True ]] || fail 'The K3s node is not Ready.'
node_hostname="$(kubectl_local get "$nodes" -o 'jsonpath={.metadata.labels.kubernetes\.io/hostname}')"
[[ "$node_hostname" =~ ^[a-zA-Z0-9._-]+$ ]] || fail 'The node hostname label is missing or invalid.'
kubectl_local get storageclass local-path >/dev/null
kubectl_local create secret generic gs-safety-env --from-env-file="$env_file" --dry-run=client -o yaml >/dev/null

cd -- "$repo_dir"
revision="$(git rev-parse --short HEAD)"
image="docker.io/library/gs-safety:${revision}-$(date -u +%Y%m%d%H%M%S)-$$"
printf 'Building %s on node %s\n' "$image" "$node_name"
docker build --tag "$image" .
docker save "$image" | k3s ctr --namespace k8s.io images import -
kubectl_local create namespace gs-safety --dry-run=client -o yaml | kubectl_local apply -f -
kubectl_local -n gs-safety create secret generic gs-safety-env \
  --from-env-file="$env_file" --dry-run=client -o yaml | kubectl_local apply -f -
sed -e "s|__IMAGE__|$image|g" -e "s|__NODE_HOSTNAME__|$node_hostname|g" \
  deploy/k3s/app.yaml | kubectl_local apply -f -
kubectl_local -n gs-safety rollout status deployment/gs-safety --timeout=300s
printf '\nReady: http://<server-IP-or-Tailscale-IP>:30080\nSQLite remains in PVC gs-safety-data.\n'
