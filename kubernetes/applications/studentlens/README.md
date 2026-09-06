# StudentLens

StudentLens is hosted as a public-facing Homelab application with its own
namespace, PostgreSQL database, Redis instance, upload volume, certificate, and
Traefik ingress.

## URLs

- `https://studentlens.net`
- `https://www.studentlens.net`

## Runtime

- Application image: `ghcr.io/sirnotethan/studentlens:latest`
- Database: PostgreSQL on Longhorn
- Cache/session store: Redis on Longhorn
- Upload storage: Longhorn PVC mounted at `/app/uploads`

## Migration status

The StudentLens backend has a local PostgreSQL schema and Appwrite export/import
foundation. Runtime remains in Appwrite-backed mode until the model layer is
migrated collection-by-collection.

Current safe migration order:

1. Users and profiles
2. Posts
3. Comments
4. Bookmarks
5. Writer applications
6. Site settings
7. Analytics and contact submissions
8. Appwrite Storage files

Passwords from Appwrite Auth should be treated as non-portable. Existing users
should reset passwords after final cutover unless Google OAuth remains the only
login path.

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
