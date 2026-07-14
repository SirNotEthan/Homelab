# Services

This is the service catalogue for planned and deployed homelab services. The
status column records whether a service is only a candidate or has been
validated on the cluster.

## Platform services

| Service | Purpose | Phase | Status | Data class |
|---|---|---|---|---|
| Traefik | Cluster ingress | v0.3 | Deployed | Configuration |
| Longhorn | Persistent volume storage | v0.3 | Deployed | Critical state |
| Homepage | Service dashboard | v0.4 | GitOps-managed | Configuration |
| Argo CD | GitOps reconciliation | v0.5 | Deployed | Reproducible configuration |
| Authentik | Identity and SSO | v0.4 | GitOps-managed | Critical database |
| Prometheus | Metrics | v0.4 | GitOps-managed | Regenerable history |
| Grafana | Dashboards and visualisation | v0.4 | GitOps-managed | Configuration |
| Loki | Centralised logs | v0.4 | GitOps-managed | Regenerable history |
| Alloy | Log collection | v0.4 | GitOps-managed | Reproducible configuration |

## Platform health and backup plan

| Service | Health check | State to protect | Backup and recovery plan |
|---|---|---|---|
| Traefik | Pods ready, LoadBalancer service assigned, ingress class present | Helm values and ingress configuration | Reconcile from Git; no runtime state backup required |
| cert-manager | Pods ready, ClusterIssuers ready, wildcard Certificate ready, no stuck challenges | Issuer and Certificate manifests; DNS provider token | Reconcile manifests from Git; recreate provider token from password manager if needed |
| Longhorn | Longhorn pods ready, nodes schedulable, volumes healthy, replicas running | Persistent volume data and Longhorn metadata | Configure Longhorn backup target; test volume restore before relying on it |
| Homepage | Pod ready, Ingress ready, HTTPS returns the service API | ConfigMap manifests | Reconcile from Git; no persistent app data backup required |
| Argo CD | Pods ready, Ingress reachable, Applications Synced and Healthy | Application definitions and local admin recovery access | Reinstall Argo CD, reapply app-of-apps from Git, use break-glass admin access when needed |
| Authentik | Server, worker, PostgreSQL, and Redis pods ready; HTTPS login works | PostgreSQL database and emergency admin access | Back up PostgreSQL application data; keep recovery credentials outside Git; test admin recovery |
| Prometheus | Prometheus, Alertmanager, operator, kube-state-metrics, and node exporters ready | Metrics history and alerting configuration | Treat metrics as useful but mostly regenerable; keep configuration in Git; protect PVC until retention expires |
| Grafana | Grafana pod ready, HTTPS login works, datasources available | Dashboards, datasource config, admin secret | Prefer declarative dashboards and datasources in Git; back up Grafana database while manual config exists |
| Loki | Loki and cache pods ready, Alloy agents ready, log queries return streams | Recent log history | Treat logs as regenerable operational history; protect Loki PVC until retention expires |
| Alloy | DaemonSet ready on all cluster nodes | Collector configuration | Reconcile from Git; no runtime state backup required |

## Development services

| Service | Purpose | Status |
|---|---|---|
| OpenVSCode | Browser-based development environment | Candidate |
| OpenCode | AI-assisted development environment | Candidate |

GitHub, Docker tooling, and Kubernetes are external dependencies or platform
components rather than user-facing hosted applications.

## Local AI services

| Service | Purpose | Status | Data class |
|---|---|---|---|
| Ollama | Local text and code model serving | Planned | Model cache and configuration |
| Open WebUI | Private browser UI for local models | Planned | User settings and chat history |
| SearxNG | Privacy-preserving metasearch for AI and human research | Planned | Configuration; minimal retained state |
| Stable Diffusion / ComfyUI | Local image-generation workflows | Candidate | Model cache, workflows, generated assets |
| Whisper | Local speech-to-text transcription | Candidate | Model cache and transient audio inputs |
| Custom Home AI | Personal assistant and skill-learning system | Planned | Critical assistant memory, skills, tool config |

The local AI platform should prefer private DNS, HTTPS ingress, Authentik SSO
where supported, and Tailscale access for trusted devices. Internet-facing AI
endpoints are out of scope unless explicitly approved and threat-modeled.

## Personal applications

| Service | Purpose | Status | Backup priority |
|---|---|---|---|
| Immich | Photo management | Candidate | Critical |
| Jellyfin | Media streaming | Candidate | Metadata critical; media defined separately |
| Vaultwarden | Password manager | Candidate | Critical |
| Paperless-ngx | Document management | Candidate | Critical |
| Home Assistant | Home automation | Candidate | High |

## Definition of ready

Before a stateful service is considered production-ready, document its owner,
version policy, dependencies, exposure, authentication, resource requests,
persistent data, backup method, restore test, monitoring, and rollback plan.
