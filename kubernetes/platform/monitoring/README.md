# Monitoring

Monitoring is provided by the `kube-prometheus-stack` Helm chart and reconciled
by Argo CD.

## Components

- Prometheus collects cluster and node metrics.
- Grafana provides dashboards at the private application hostname.
- Alertmanager is installed for future alert routing.
- kube-state-metrics and node-exporter expose Kubernetes and host metrics.

## Access

Grafana is exposed through Traefik using the private application DNS namespace
and the shared wildcard application certificate.

The Grafana administrator password is stored in the in-cluster
`grafana-admin` Secret in the `monitoring` namespace. The secret value is not
stored in Git. The Secret is reconciled from the encrypted SealedSecret under
`kubernetes/platform/monitoring/secrets/`.

## Storage

Prometheus, Alertmanager, and Grafana use the Longhorn-backed
`longhorn-2replica` StorageClass.

## Dashboards

The Helm values include a `Homelab AI Node` Grafana dashboard for the first AI
worker, `m700-03`.

It tracks:

- AI namespace CPU usage by pod;
- AI namespace memory usage by pod;
- AI CPU share of the node allocatable CPU;
- AI memory share of the node allocatable memory.

Use it to watch the impact of Ollama, Open WebUI, and SearXNG while testing
local models.

## Validation

```bash
kubectl get pods,pvc,ingress -n monitoring
helm list -n monitoring
```

From a Windows client:

```powershell
Resolve-DnsName grafana.apps.lab.sirnotethan.uk
Invoke-WebRequest https://grafana.apps.lab.sirnotethan.uk -UseBasicParsing
```
