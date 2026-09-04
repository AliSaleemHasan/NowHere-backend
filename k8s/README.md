# Kubernetes manifests

Gateway is the only external HTTP Service. Snaps HTTP is ClusterIP; Socket.IO should be exposed via the Ingress websocket path, not a LoadBalancer on the whole snaps API.

## Secrets

Copy example files, fill real values locally, then apply **your** secret directory. Example files contain `change_me_*` only.

```bash
cp -r k8s/secrets.example k8s/secrets
# edit k8s/secrets/*.yaml — this directory is gitignored
kubectl apply -f k8s/secrets
kubectl apply -f k8s
```

Do not commit live secret YAML. Rotate anything that previously lived in this repo's working tree.
