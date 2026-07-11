# Services

This is the service catalogue for planned and deployed homelab services. The
status column records whether a service is only a candidate or has been
validated on the cluster.

## Platform services

| Service | Purpose | Phase | Status | Data class |
|---|---|---|---|---|
| Traefik | Cluster ingress | v0.3 | Deployed | Configuration |
| Longhorn | Persistent volume storage | v0.3 | Deployed | Critical state |
| Homepage | Service dashboard | v0.4 | Deployed | Configuration |
| Argo CD | GitOps reconciliation | v0.5 | Deployed | Reproducible configuration |
| Authentik | Identity and SSO | v0.4 | Planned | Critical database |
| Prometheus | Metrics | v0.4 | Planned | Regenerable history |
| Grafana | Dashboards and visualisation | v0.4 | Planned | Configuration |
| Loki | Centralised logs | v0.4 | Planned | Regenerable history |

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
