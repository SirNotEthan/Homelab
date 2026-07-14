# Homelab AI foundation

This directory defines the local personal AI layer that will sit on top of the
homelab AI platform.

The Kubernetes platform provides the runtime services:

- Ollama for local model serving;
- Open WebUI for browser access;
- SearXNG for private search.

This directory defines the assistant-facing layer:

- model roles and routing preferences;
- personas;
- skill files;
- memory policy;
- tool registry.

The goal is a private, local, user-controlled assistant that can grow from
curated skills and local context without depending on cloud-hosted model
providers.

## Layout

| Path | Purpose |
|---|---|
| `models/` | Local model registry and intended roles |
| `personas/` | System prompt/persona drafts for Open WebUI or future orchestration |
| `skills/` | Curated skill files the assistant can learn from |
| `memory/` | Rules for what the assistant may remember and how memory is stored |
| `tools/` | Tool and integration registry |

## Current phase

The first phase is deliberately simple:

1. Run SearXNG.
2. Run Ollama.
3. Run Open WebUI.
4. Load small local models.
5. Create reusable personas and skill files.
6. Later, add an orchestrator that can route work across models and tools.

## Local-first rules

- Prefer local models and local search.
- Keep model APIs private to the cluster unless there is a documented reason to
  expose them.
- Store prompts, chats, memories, and generated artifacts locally unless a
  workflow explicitly says otherwise.
- Treat assistant memory, skills, and tool credentials as sensitive.
