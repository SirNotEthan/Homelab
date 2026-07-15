# Local model lifecycle

This directory tracks the local model set used by the homelab AI platform.

The running model cache lives in Ollama on the `ollama-data` PVC. The Git
repository records intended models, roles, and operating policy; it does not
store downloaded model weights.

## Current runtime

- Runtime: Ollama
- Runtime namespace: `ai`
- Runtime service: `http://ollama.ai.svc.cluster.local:11434`
- Initial AI node: `m700-03`
- Human UI: `https://ai.apps.lab.sirnotethan.uk`

## Current model set

| Model | Role | Notes |
|---|---|---|
| `qwen2.5-coder:1.5b` | Lightweight code help | Fastest coding/configuration helper in the first set. |
| `llama3.2:3b` | General chat | Default candidate for normal local chat. |
| `phi3:mini` | Compact reasoning and summaries | Small fallback model for quick responses. |

## Adding a model

Before adding a model:

1. Check available space on the Ollama PVC and AI node.
2. Prefer small CPU-friendly models unless a stronger AI host or GPU host is
   available.
3. Record the model in `model-registry.yaml` before treating it as part of the
   supported local AI platform.
4. Pull the model through the Ollama deployment.
5. Run a one-prompt smoke test.
6. Update docs if the model becomes a default for a role.

Example:

```bash
kubectl exec -n ai deploy/ollama -- ollama pull llama3.2:3b
kubectl exec -n ai deploy/ollama -- ollama list
kubectl exec -n ai deploy/ollama -- \
  ollama run llama3.2:3b "Reply with one short sentence confirming you work."
```

## Updating models

Ollama tags can move over time. Treat model updates as intentional changes:

1. Pull the updated model.
2. Smoke test it in Ollama.
3. Test it through Open WebUI.
4. Record any behaviour or performance change in the relevant docs.
5. Commit the registry or documentation change if the supported model set
   changes.

## Removing models

Remove models only after checking they are not the preferred model for a role in
`model-registry.yaml` or Open WebUI.

```bash
kubectl exec -n ai deploy/ollama -- ollama rm <model-name>
kubectl exec -n ai deploy/ollama -- ollama list
```

Then update `model-registry.yaml`.

## Performance notes

- Keep routine chat on small models until a stronger host is available.
- Web-search-assisted answers are slower because they add a search and context
  retrieval step before model generation.
- `OLLAMA_KEEP_ALIVE` is set to keep recently used models warm for faster repeat
  prompts.
- Larger models should be evaluated only after documenting CPU, memory, disk,
  and response-time impact.
