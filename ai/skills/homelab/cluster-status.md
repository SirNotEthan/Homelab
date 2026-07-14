# Cluster status skill

## Purpose

Check the basic health of the homelab Kubernetes cluster.

## When to use

Use before and after platform changes, GitOps reconciliations, upgrades, or
troubleshooting sessions.

## Procedure

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get nodes -o wide
kubectl get application -n argocd
kubectl get pods -A | grep -v Running | grep -v Completed || true
```

## Validation

- All expected nodes are `Ready`.
- Argo CD Applications are `Synced` and `Healthy`, unless a change is actively
  reconciling.
- No unexpected non-running pods remain.
