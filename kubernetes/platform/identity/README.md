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

The following Kubernetes Secrets are required before applying the Helm release:

- `authentik-secrets`
- `authentik-postgresql`

They are intentionally created manually and are not stored in Git until
they are migrated to SealedSecret resources.

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
