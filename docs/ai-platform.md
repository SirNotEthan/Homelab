# Local AI platform

## Purpose

The local AI platform will provide private model serving, search augmentation,
speech processing, image workflows, and a foundation for a future custom home
AI assistant.

The platform should prefer local execution, private networking, and explicit
tool boundaries. External AI services may still be used deliberately, but the
homelab should be capable of useful private AI workflows without sending every
prompt, search, or file to third-party services.

## Initial goals

- Serve local text and code models with Ollama.
- Provide a private browser interface with Open WebUI or an equivalent UI.
- Provide privacy-preserving search with SearxNG.
- Evaluate local image workflows with Stable Diffusion and ComfyUI.
- Evaluate local speech-to-text with Whisper.
- Build toward a custom home AI and assistant that can learn curated skill
  files and operate against explicitly approved homelab tools.

## Candidate components

| Component | Role | Initial stance |
|---|---|---|
| Ollama | Model runtime and model lifecycle manager | Preferred first deployment |
| Open WebUI | Browser UI and chat workspace for local models | Likely first UI |
| SearxNG | Private metasearch layer for research and retrieval | Required before search-augmented AI workflows |
| Stable Diffusion / ComfyUI | Image generation and workflow graph execution | Evaluate after base text/search stack |
| Whisper | Speech-to-text for local audio transcription | Evaluate after base text/search stack |
| Code assistant tooling | Local code help routed through Ollama-compatible models | Evaluate after Ollama baseline |
| Custom Home AI | Long-term assistant layer with curated skills and homelab tool access | Design before implementation |

## Home AI foundation

The repository now includes an `ai/` directory for the assistant-facing layer.
It is separate from Kubernetes runtime manifests.

| Path | Purpose |
|---|---|
| `ai/models/` | Model registry and routing preferences |
| `ai/personas/` | Persona and system-prompt drafts |
| `ai/skills/` | Curated skills the assistant can learn from |
| `ai/memory/` | Memory policy and future memory layout |
| `ai/tools/` | Tool and integration registry |

The first foundation files define a local Home AI Core persona, a code-assistant
persona, a research persona, a model registry, and starter skills for cluster
status and GitOps application work.

## Access model

- Expose user-facing AI services only through private DNS, HTTPS ingress, and
  Tailscale-accessible routes.
- Prefer Authentik SSO for browser-facing services that support it.
- Keep administrative APIs private and restrict them to trusted operators.
- Do not expose model APIs directly to the public internet.
- Avoid retaining prompts, chats, audio, generated images, or tool traces unless
  the retention policy is documented.

## Placement and resource planning

Model workloads are resource-sensitive. Before deployment, record:

- whether workloads run in Kubernetes or directly on a dedicated host;
- CPU, memory, disk, and GPU requirements;
- where model caches live;
- how generated assets are stored and backed up;
- whether workloads can tolerate eviction or node loss;
- whether a service needs persistent Longhorn storage or host-local storage.

The first deployment should be conservative: text model serving and a web UI
before adding image generation or always-on voice services.

Initial placement decision:

- `m700-03` is the first AI/lab Kubernetes node.
- The node is labelled with `homelab.sirnotethan.uk/workload=ai` and
  `homelab.sirnotethan.uk/ai=true`.
- Early AI platform services should use a `nodeSelector` for
  `homelab.sirnotethan.uk/workload: ai`.
- The control-plane node is intentionally avoided for experimental or heavy AI
  workloads.

This placement is suitable for SearXNG, Open WebUI, automation glue, and small
CPU-only Ollama models. A future GPU host should become the dedicated model
runtime if image generation, speech workloads, or larger code/text models become
important.

Initial Ollama deployment posture:

- Run Ollama in Kubernetes on `m700-03`.
- Keep the Ollama API internal to the cluster.
- Expose human access through Open WebUI rather than direct ingress.
- Use Longhorn-backed storage for model files so the first deployment survives
  pod rescheduling on the AI node.
- Start with small CPU-friendly models before testing larger workloads.
- Keep recently used models warm with `OLLAMA_KEEP_ALIVE=30m`.
- Record supported models and update/removal policy in `ai/models/`.
- Monitor AI pod CPU and memory usage with the `Homelab AI Node` Grafana
  dashboard.

Initial Open WebUI deployment posture:

- Run Open WebUI in Kubernetes on `m700-03`.
- Expose it privately at `https://ai.apps.lab.sirnotethan.uk`.
- Connect it to the internal Ollama service at
  `http://ollama.ai.svc.cluster.local:11434`.
- Use the internal SearXNG service for private web search augmentation at
  `http://searxng.ai.svc.cluster.local/search?q=<query>&format=json`.
- Store Open WebUI user data and chat history on a Longhorn-backed PVC.
- Use local Open WebUI admin login first; add Authentik SSO after the base AI
  interface is stable.

## Privacy requirements

- Route AI research search through SearxNG where practical.
- Avoid unnecessary third-party telemetry.
- Keep model prompts and generated outputs private by default.
- Document any external API calls made by the custom assistant.
- Treat assistant memory, skill files, and tool credentials as sensitive.

## Backup and recovery

The AI platform will likely contain a mix of reproducible and valuable state:

| Data | Backup priority |
|---|---|
| Git-managed configuration | Git history |
| Downloaded model files | Re-downloadable unless bandwidth/time becomes a concern |
| Open WebUI user data and chat history | User decision; default to important if retained |
| SearxNG configuration | Git-managed |
| ComfyUI workflows | Important if customized |
| Generated images/audio/transcripts | User decision; document per workflow |
| Custom assistant memory and skills | Critical once it becomes useful |

## Open questions

- Which host should carry AI workloads?
- Is GPU acceleration available or planned?
- Should Ollama run inside Kubernetes or directly on a host?
- Should Open WebUI use Authentik directly or rely on private-network access
  first?
- What is the default retention policy for prompts, chats, generated media, and
  assistant memory?
- What tool permissions will the custom home AI receive, and how will those
  permissions be reviewed?
