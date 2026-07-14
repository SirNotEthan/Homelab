# Identity

Identity and SSO are provided by Authentik.

## Components

- Authentik server handles browser/API traffic.
- Authentik worker handles background tasks.
- PostgreSQL stores Authentik state on Longhorn-backed persistent storage.
- Redis is deployed by the Authentik chart for cache and queue support.

## Access

Authentik is exposed through Traefik at the private application hostname using
the shared wildcard application certificate.

## Secrets

The following Kubernetes Secrets are required by the Helm release:

- `authentik-secrets`
- `authentik-postgresql`

They are reconciled from encrypted SealedSecret resources under
`kubernetes/platform/identity/secrets/`. Plain Kubernetes Secret manifests and
plaintext values must not be committed.

Required keys:

```text
authentik-secrets:
  AUTHENTIK_SECRET_KEY
  AUTHENTIK_POSTGRESQL__HOST
  AUTHENTIK_POSTGRESQL__NAME
  AUTHENTIK_POSTGRESQL__USER
  AUTHENTIK_POSTGRESQL__PASSWORD

authentik-postgresql:
  password
  postgres-password
```

## Validation

```bash
kubectl get pods,svc,ingress,pvc -n identity -o wide
helm list -n identity
```

From a Windows client:

```powershell
Resolve-DnsName auth.apps.lab.sirnotethan.uk
Invoke-WebRequest https://auth.apps.lab.sirnotethan.uk -UseBasicParsing
```
