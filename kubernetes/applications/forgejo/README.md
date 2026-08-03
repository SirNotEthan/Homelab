# Forgejo

Self-hosted git (Gitea fork) for private repos - a self-hosted alternative
to pushing everything to GitHub.

## Access

- URL: `https://git.apps.lab.sirnotethan.uk`
- Namespace: `forgejo`
- Service: `forgejo`
- Clone URL: `https://git.apps.lab.sirnotethan.uk/<owner>/<repo>.git`
  (HTTPS only - see below)

## Git over SSH is not exposed

`GITEA__server__DISABLE_SSH: "true"` - there's no MetalLB/NodePort set up
for port 22 yet, so this deploys HTTPS-only to start. Clone/push over
HTTPS with a personal access token (Settings -> Applications, once you have
an account). If you want SSH later, re-enable it and expose port 22 via a
NodePort the same way AdGuard works around missing port 53 LoadBalancer
support.

## Creating your account

Public registration is disabled (`GITEA__service__DISABLE_REGISTRATION:
"true"`). Create the first (admin) account directly:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl exec -n forgejo deploy/forgejo -- forgejo admin user create \
  --username <you> \
  --password '<choose-a-strong-password>' \
  --email <you>@example.com \
  --admin
```

## Storage

`forgejo-data` (`longhorn-2replica`, `20Gi`) - repos, SQLite database,
attachments, and config (`/data/gitea/conf/app.ini` is generated on first
boot). Grow this as your repos grow.

## Validation

```bash
kubectl get pods,svc,ingress,pvc -n forgejo -o wide
kubectl logs -n forgejo deploy/forgejo --tail=80
```
