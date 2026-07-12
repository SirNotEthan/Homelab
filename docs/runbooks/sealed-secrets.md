# Sealed Secrets runbook

## Purpose

Use Sealed Secrets to keep Kubernetes Secret values out of Git while allowing
Argo CD to reconcile the encrypted desired state.

This runbook intentionally uses placeholders for secret values. Do not paste
real tokens, passwords, private keys, recovery codes, or kubeconfigs into this
repository.

## Scope

Initial migration candidates:

| Namespace | Secret | Used by |
|---|---|---|
| `cert-manager` | `cloudflare-api-token-secret` | cert-manager DNS-01 solver |
| `monitoring` | `grafana-admin` | Grafana admin login |
| `identity` | `authentik-secrets` | Authentik application configuration |
| `identity` | `authentik-postgresql` | Authentik PostgreSQL chart |

Generated Secrets such as ACME account keys, issued TLS certificates, service
account tokens, and Helm release Secrets are not manually sealed.

## Controller installation

Install the controller into its own namespace through Argo CD. The initial
GitOps definition pins the `sealed-secrets` Helm chart to `2.19.1`.

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl apply -k kubernetes/platform/argocd

kubectl annotate application sealed-secrets -n argocd \
  argocd.argoproj.io/refresh=hard \
  --overwrite

kubectl get pods -n sealed-secrets
kubectl get application sealed-secrets -n argocd
```

## Client installation

Install `kubeseal` on the administrative workstation. Use the release that
matches the controller version where practical.

Validate access to the controller certificate:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubeseal \
  --controller-name sealed-secrets \
  --controller-namespace sealed-secrets \
  --fetch-cert > .local/sealed-secrets-public-cert.pem
```

The public certificate is not secret, but `.local/` remains the right place for
operator scratch files.

## Creating a sealed secret

Create a plaintext Secret locally and pipe it directly into `kubeseal`. Do not
write plaintext Secret YAML into the repository.

Example pattern:

```bash
kubectl create secret generic <secret-name> \
  --namespace <namespace> \
  --from-literal=<key-name>="<secret-value>" \
  --dry-run=client \
  -o yaml |
kubeseal \
  --controller-name sealed-secrets \
  --controller-namespace sealed-secrets \
  --format yaml \
  > kubernetes/<path>/<secret-name>.sealedsecret.yaml
```

Review before committing:

```bash
grep -R "kind: Secret" kubernetes
grep -R "<secret-value>" kubernetes || true
kubectl apply --dry-run=server -f kubernetes/<path>/<secret-name>.sealedsecret.yaml
```

Expected resource kind:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
```

## Applying and validating

Apply through GitOps once the relevant Argo CD Application includes the sealed
secret manifest.

Manual validation pattern:

```bash
kubectl get sealedsecret -A
kubectl get secret <secret-name> -n <namespace>
kubectl get application -n argocd
```

Then verify the consuming workload:

```bash
kubectl rollout status deployment/<deployment-name> -n <namespace>
kubectl get pods -n <namespace>
```

## Controller private-key backup

The Sealed Secrets controller private key is required to decrypt committed
SealedSecret resources after a cluster rebuild.

Back it up outside Git:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get secret -n sealed-secrets \
  -l sealedsecrets.bitnami.com/sealed-secrets-key \
  -o yaml > .local/sealed-secrets-controller-key-backup.yaml
```

Store a copy in the same protected location as other break-glass recovery
material. Treat this file as highly sensitive.

## Test record

### 2026-07-12

Passed:

- Argo CD `sealed-secrets` Application reported `Synced` and `Healthy`.
- The controller pod reported `Running`.
- The `sealedsecrets.bitnami.com` CRD existed.
- A controller key Secret existed in the `sealed-secrets` namespace.
- The controller private key was exported to `.local/` and verified to contain
  Secret material.
- The Grafana admin Secret was sealed, reconciled by the `monitoring-secrets`
  Argo CD Application, and remained available to the running Grafana pod.
- The Cloudflare API token Secret was sealed, reconciled by the
  `cert-manager-secrets` Argo CD Application, and cert-manager issuers and
  wildcard certificates remained Ready.

## Restore after cluster rebuild

Before applying sealed secret manifests on a rebuilt cluster, restore the
controller private key:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl create namespace sealed-secrets
kubectl apply -f .local/sealed-secrets-controller-key-backup.yaml

helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace sealed-secrets \
  --version 2.19.1 \
  --wait \
  --timeout 10m
```

Then reconcile the GitOps applications and confirm that Secrets are created.

## Rotation

Rotate a managed secret by creating a new plaintext Secret locally, sealing it,
committing the updated `SealedSecret`, and validating the consuming workload.

If the Sealed Secrets controller private key is exposed:

1. Treat all secrets encrypted to that key as compromised.
2. Install a fresh controller key or rotate the controller certificate.
3. Reseal every managed secret with the new public certificate.
4. Rotate the underlying credentials at their source.
5. Record the incident without reproducing secret values.
