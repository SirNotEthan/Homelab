# Argo CD

Argo CD provides GitOps reconciliation for the homelab cluster.

## Bootstrap model

Argo CD itself is installed manually from the official upstream installation
manifest during the initial GitOps bootstrap. The local manifests in this
directory configure homelab-specific access on top of that installation.

After the access manifests are committed and pushed, `application.yaml` can be
applied manually once so Argo CD starts managing this directory from Git.

This directory intentionally does not contain:

- administrator passwords;
- repository credentials;
- private network addresses;
- cluster tokens or kubeconfigs.

## Access

Argo CD is exposed through the private application DNS namespace behind Traefik
and the existing wildcard application certificate.

The API server is configured for insecure HTTP inside the cluster because TLS is
terminated at Traefik. External browser access still uses HTTPS.

## Validation

After bootstrap:

```bash
kubectl get pods,svc,ingress -n argocd -o wide
kubectl get configmap argocd-cmd-params-cm -n argocd -o yaml
kubectl get application argocd-access -n argocd
```

From a Windows client:

```powershell
Resolve-DnsName argocd.apps.lab.sirnotethan.uk
Invoke-WebRequest https://argocd.apps.lab.sirnotethan.uk -UseBasicParsing
```
