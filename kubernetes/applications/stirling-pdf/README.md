# Stirling PDF

Stateless PDF toolbox (merge, split, convert, OCR, compress, etc.).

## Access

- URL: `https://pdf.apps.lab.sirnotethan.uk`
- Namespace: `stirling-pdf`
- Service: `stirling-pdf`

No login is enabled (`DOCKER_ENABLE_SECURITY=false`) - anyone who can reach
the URL can use it. That's fine if `*.apps.lab.sirnotethan.uk` only resolves
over Tailscale/LAN, same as the other apps in this repo. If you want a login,
set `DOCKER_ENABLE_SECURITY=true` and see the Stirling PDF docs for creating
the initial admin account.

## Storage

`stirling-pdf-config` (`longhorn-2replica`, `2Gi`) persists app settings
only - uploaded/processed files are not retained after a job completes.

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get pods,svc,ingress,pvc -n stirling-pdf -o wide
kubectl logs -n stirling-pdf deploy/stirling-pdf --tail=80
```
