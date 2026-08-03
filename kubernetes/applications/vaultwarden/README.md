# Vaultwarden

Bitwarden-compatible password manager server. This is the highest-value
security target in this batch of apps - treat its secret and backups
accordingly.

## Access

- URL: `https://vault.apps.lab.sirnotethan.uk`
- Namespace: `vaultwarden`
- Service: `vaultwarden`
- Bitwarden apps/extensions: point them at the "self-hosted" server URL
  above instead of bitwarden.com.

## Required secret

Create the admin token before syncing the Argo CD application - this token
gates `/admin`, the panel used to manage users and invite/disable accounts:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl create namespace vaultwarden --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic vaultwarden-secrets \
  -n vaultwarden \
  --from-literal=ADMIN_TOKEN="$(openssl rand -base64 48)" \
  --dry-run=client -o yaml | kubectl apply -f -
```

This Secret should be migrated to Sealed Secrets after the first successful
deployment (see `docs/runbooks/sealed-secrets.md`).

## Creating your account

Signups are disabled by default (`SIGNUPS_ALLOWED: "false"`). To create your
own account:

1. Temporarily set `SIGNUPS_ALLOWED` to `"true"` in `deployment.yaml`,
   commit, sync.
2. Register your account at the URL above.
3. Set `SIGNUPS_ALLOWED` back to `"false"`, commit, sync again.

Alternatively, use `/admin` (the token you generated above) to send yourself
an invite instead of touching the signup flag.

## Backups

This is a password vault - back it up like it matters. `vaultwarden-data`
holds the SQLite database and attachments; confirm it's covered by whatever
this repo's backup process is (`backups/`) before you rely on this for real
passwords.

## Storage

`vaultwarden-data` (`longhorn-2replica`, `5Gi`).

## Validation

```bash
kubectl get pods,svc,ingress,pvc -n vaultwarden -o wide
kubectl logs -n vaultwarden deploy/vaultwarden --tail=80
```
