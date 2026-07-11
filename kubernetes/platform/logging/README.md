# Logging

Cluster logs are collected with Grafana Alloy and stored in Grafana Loki.

## Components

- Loki runs inside the cluster as a single-binary deployment for the homelab
  scale.
- Alloy runs as a DaemonSet and collects Kubernetes pod logs from every node.
- Grafana uses Loki as an additional datasource for log exploration.

## Access

Loki is cluster-internal only. It is not exposed through private DNS or ingress.
Logs are queried through Grafana.

## Storage

Loki stores log data on a Longhorn-backed persistent volume using the
`longhorn-2replica` StorageClass.

## Validation

```bash
kubectl get pods,pvc,svc -n logging -o wide
```

Query Loki labels from inside the cluster:

```bash
kubectl run loki-query-test \
  -n logging \
  --rm -i \
  --restart=Never \
  --image=curlimages/curl \
  --command -- sh -c 'curl -sS http://loki-gateway.logging.svc.cluster.local/loki/api/v1/labels; echo'
```

Query recent monitoring logs:

```bash
kubectl run loki-query-test \
  -n logging \
  --rm -i \
  --restart=Never \
  --image=curlimages/curl \
  --command -- sh -c '
curl -G -sS "http://loki-gateway.logging.svc.cluster.local/loki/api/v1/query_range" \
  --data-urlencode "query={namespace=\"monitoring\"}" \
  --data-urlencode "limit=5"
echo
'
```
