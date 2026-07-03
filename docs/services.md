# Services

This is a target service catalogue. A listing means a service is under
consideration or planned; it does not imply that it is deployed.

## Platform services

| Service | Purpose | Phase | Data class |
|---|---|---|---|
| Traefik | Cluster ingress | v0.3 | Configuration |
| Longhorn | Persistent volume storage | v0.3 | Critical state |
| Argo CD | GitOps reconciliation | v0.5 | Reproducible configuration |
| Authentik | Identity and SSO | v0.4 | Critical database |
| Prometheus | Metrics | v0.4 | Regenerable history |
| Grafana | Dashboards and visualisation | v0.4 | Configuration |
| Loki | Centralised logs | v0.4 | Regenerable history |
| Homepage | Service dashboard | v0.4 | Configuration |

## Development services

| Service | Purpose | Status |
|---|---|---|
| OpenVSCode | Browser-based development environment | Candidate |
| OpenCode | AI-assisted development environment | Candidate |

GitHub, Docker tooling, and Kubernetes are external dependencies or platform
components rather than user-facing hosted applications.

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
