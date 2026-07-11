# Kubernetes platform

Shared capabilities such as GitOps, identity, and observability belong here.
Each component should document dependencies, access, monitoring, backup, and
recovery.

## Components

| Component | Purpose |
|---|---|
| `argocd/` | GitOps reconciliation and Argo CD application definitions |
| `logging/` | Loki log storage and Alloy log collection configuration |
| `monitoring/` | Prometheus, Grafana, Alertmanager, and exporter configuration |
