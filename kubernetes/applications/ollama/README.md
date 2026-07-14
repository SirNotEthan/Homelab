# Ollama

Ollama provides local text and code model serving for the homelab AI platform.

## Access

- Namespace: `ai`
- Service: `ollama`
- Cluster URL: `http://ollama.ai.svc.cluster.local:11434`

Ollama is intentionally not exposed through ingress. Browser and user access
should go through Open WebUI or another authenticated front end.

## Placement

The workload is pinned to the first AI/lab node:

```yaml
nodeSelector:
  homelab.sirnotethan.uk/workload: ai
```

## Storage

Model data is stored on the `ollama-data` PVC using the `longhorn-2replica`
storage class.

Initial size: `20Gi`.

## First model

After the deployment is healthy, pull a small CPU-friendly model:

```bash
kubectl exec -n ai deploy/ollama -- ollama pull qwen2.5-coder:1.5b
kubectl exec -n ai deploy/ollama -- ollama list
```

Run a smoke test:

```bash
kubectl exec -n ai deploy/ollama -- \
  ollama run qwen2.5-coder:1.5b "Reply with one sentence: Ollama is running."
```

## Validation

```bash
kubectl get pods,svc,pvc -n ai -o wide
kubectl logs -n ai deploy/ollama --tail=80
kubectl exec -n ai deploy/ollama -- ollama --version
```
