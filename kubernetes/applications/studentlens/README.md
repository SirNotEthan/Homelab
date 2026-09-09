# StudentLens

StudentLens is hosted as a public-facing Homelab application with its own
namespace, PostgreSQL database, Redis instance, persistent upload volume, and
Traefik ingress.

## URLs

- `https://studentlens.net`
- `https://www.studentlens.net`
- `https://studentlens.sirnotethan.uk`

## Runtime

- Application image: `ghcr.io/sirnotethan/studentlens:latest`
- Database: PostgreSQL on Longhorn
- Cache/session store: Redis on Longhorn
- Upload storage: Longhorn PVC mounted at `/app/uploads`
- Public TLS for `studentlens.net`: Cloudflare Tunnel edge certificate
- Private TLS for `studentlens.sirnotethan.uk`: cert-manager certificate

## Migration status

The StudentLens runtime and legacy Appwrite dataset are migrated to local
PostgreSQL and persistent storage. The verified import contains 45 users, 42
posts, 13 writer applications, one site-settings record, and five stored files.
Twelve bookmarks whose source posts no longer exist were preserved in the
private raw export and intentionally skipped.

All 45 imported Appwrite Argon2id password hashes are retained. A successful
email/password login transparently upgrades the account to the application's
native bcrypt format. Google OAuth accounts continue through the configured
local callback.

## Reconcile

```bash
kubectl annotate application argocd-access -n argocd \
  argocd.argoproj.io/refresh=hard \
  --overwrite

kubectl patch application argocd-access -n argocd \
  --type merge \
  -p '{"operation":{"sync":{"syncStrategy":{"hook":{}}}}}'
```

Then check:

```bash
kubectl get application studentlens -n argocd
kubectl get pods,svc,ingress,pvc -n studentlens -o wide
kubectl get certificate -n studentlens
```
