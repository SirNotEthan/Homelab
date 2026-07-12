# Sealed Secrets

Sealed Secrets provides GitOps-compatible encrypted Kubernetes Secrets.

## Components

- The Sealed Secrets controller runs in the `sealed-secrets` namespace.
- `kubeseal` runs on the administrative workstation and encrypts plaintext
  Secret manifests using the controller public certificate.
- Argo CD reconciles committed `SealedSecret` resources.

## Recovery-critical material

The controller private key is required to decrypt committed SealedSecret
resources after a cluster rebuild. Back it up outside Git immediately after
installing the controller.

See the [Sealed Secrets runbook](../../../docs/runbooks/sealed-secrets.md).

## Validation

```bash
kubectl get pods -n sealed-secrets
kubectl get application sealed-secrets -n argocd
```

Expected baseline:

- the controller pod is running;
- the Argo CD Application reports `Synced` and `Healthy`;
- the controller key backup exists outside Git.
