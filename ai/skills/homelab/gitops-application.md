# GitOps application skill

## Purpose

Add or update a GitOps-managed Kubernetes application.

## When to use

Use when deploying a new service or changing an existing service that is managed
by Argo CD.

## Procedure

1. Add or update manifests under `kubernetes/applications/<app-name>/` or the
   relevant platform directory.
2. Add an Argo CD `Application` under
   `kubernetes/platform/argocd/applications/`.
3. Add the new `Application` to
   `kubernetes/platform/argocd/kustomization.yaml`.
4. Validate the manifests with `kubectl kustomize`.
5. Commit and push.
6. Hard-refresh and sync the parent Argo CD application.

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get application -n argocd
kubectl get pods,svc,ingress -n <namespace> -o wide
```

## Notes

Keep plaintext Secrets out of Git. Use Sealed Secrets for GitOps-managed
Kubernetes Secrets.
