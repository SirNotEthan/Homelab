# ADR-0010: Split AI workloads between Kubernetes and a future dedicated AI host

## Status

Accepted

## Context

The homelab now runs a small local AI platform on the k3s cluster:

- Ollama for local model serving;
- Open WebUI for browser access;
- SearXNG for privacy-preserving search augmentation.

These services currently run on the `m700-03` worker, which is labelled as the
first AI/lab Kubernetes node. This is enough for small CPU-only text models and
supporting web services, but it is not the right long-term home for large
models, GPU-backed image generation, or heavy audio/video workflows.

The cluster also hosts core platform services, so experimental AI workloads
must not be allowed to starve the rest of the homelab.

## Decision

Run lightweight and control-plane AI services in Kubernetes. Move heavy model
runtime workloads to a dedicated AI host when the hardware exists.

Kubernetes is the default home for:

- Open WebUI;
- SearXNG;
- small CPU-friendly Ollama models;
- AI helper APIs and automation glue;
- lightweight or batch speech-to-text experiments;
- service configuration, ingress, DNS, certificates, monitoring, and GitOps.

A dedicated AI host is the preferred future home for:

- larger Ollama models;
- Stable Diffusion;
- ComfyUI;
- GPU-backed inference;
- long-running image, audio, or video processing;
- any training or fine-tuning experiments;
- model caches that are too large or too performance-sensitive for Longhorn.

The Kubernetes `ai` namespace has ResourceQuota and LimitRange guardrails. Heavy
AI services should not be added to Kubernetes unless their CPU, memory, storage,
and response-time impact has been recorded first.

## Consequences

- The current cluster can safely host the private AI interface and small local
  models without turning the whole homelab into a science-fair firework.
- Future GPU work can be designed around the hardware that actually exists,
  instead of forcing Kubernetes to pretend the current nodes are bigger than
  they are.
- Open WebUI can remain the browser-facing front end even if Ollama later moves
  to a dedicated host.
- Networking, Authentik, monitoring, and GitOps can remain cluster-managed.
- The AI platform needs a documented migration path if Ollama moves out of the
  cluster.

## Alternatives considered

### Run all AI workloads in Kubernetes

Simple from a GitOps perspective, but risky for the current hardware. Larger
models, image generation, and GPU workloads can exhaust CPU, memory, storage, or
node scheduling capacity.

### Run all AI workloads directly on a host

Good for performance-sensitive model runtimes, but weaker for repeatable
configuration, ingress, certificates, monitoring, and service discovery.

### Wait for a GPU host before deploying AI

Would avoid early compromises, but delays useful private search, chat, and code
workflows that already run acceptably on the current hardware.

## References

- [Local AI platform](../ai-platform.md)
- [Ollama application README](../../kubernetes/applications/ollama/README.md)
- [Open WebUI application README](../../kubernetes/applications/open-webui/README.md)
