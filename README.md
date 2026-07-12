# Homelab

> A personal cloud platform built with Kubernetes, GitOps, and Infrastructure as Code.

This repository is the source of truth for the homelab. It contains the
documentation, infrastructure definitions, and recovery procedures needed to
understand and rebuild the platform without relying on terminal history or
memory.

## Current status

Version **0.2.0** establishes the host and network baseline. The homelab now
has a running k3s cluster, private DNS, HTTPS ingress, distributed storage, a
service dashboard, and the first GitOps-managed applications.

The platform is usable for controlled homelab workloads, but it is not yet
production-ready. Encrypted secret management, independent persistent-volume
backups, and restore exercises are still active roadmap items.

## Principles

- Infrastructure and configuration are defined as code.
- Git is the source of truth for desired state.
- Manual steps are automated or documented.
- Management services are not exposed directly to the public internet.
- HTTPS, least privilege, and strong authentication are the defaults.
- Every stateful service has an explicit backup and recovery plan.
- Recovery procedures are tested, not merely written down.

## Hardware

| Host | Role |
|---|---|
| `m910q-01` | k3s control plane |
| `m700-01` | k3s worker |
| `m700-02` | k3s worker |
| `m700-03` | k3s worker and lab node |
| `hp-utility-01` | Backup and utility host |

See [docs/hardware.md](docs/hardware.md) for the inventory.

## Target platform

| Capability | Current state |
|---|---|
| Ubuntu host baseline | Automated with Ansible |
| Remote administration | Tailscale deployed |
| Kubernetes | k3s control plane and workers deployed |
| Private DNS | Managed resolver with split DNS |
| Ingress | Traefik deployed |
| Certificates | cert-manager and wildcard certificate deployed |
| Storage | Longhorn deployed and smoke-tested |
| GitOps | Argo CD deployed; selected applications reconcile from `main` |
| Dashboard | Homepage deployed and GitOps-managed |
| Observability | Prometheus, Grafana, and Loki deployed; GitOps-managed |
| Identity and SSO | Authentik deployed and GitOps-managed |

Applications listed in [docs/services.md](docs/services.md) are candidates, not
all currently deployed services.

## Repository layout

| Path | Purpose |
|---|---|
| `ansible/` | Host configuration and repeatable operating-system changes |
| `bootstrap/` | First-run host and cluster bootstrap tooling |
| `docs/` | Architecture, operations, standards, and decisions |
| `kubernetes/` | Cluster infrastructure, platform, and application manifests |
| `monitoring/` | Dashboards, alerts, and observability configuration |
| `scripts/` | Small operational and validation utilities |
| `terraform/` | Declarative infrastructure managed outside Kubernetes |

Backup data and secrets do not belong in Git. The `backups/` directory contains
documentation and configuration only.

## Documentation

- [Architecture](docs/architecture.md)
- [Hardware inventory](docs/hardware.md)
- [Network](docs/network.md)
- [Security](docs/security.md)
- [Services](docs/services.md)
- [Storage](docs/storage.md)
- [Backups](docs/backups.md)
- [Disaster recovery](docs/disaster-recovery.md)
- [Cluster status runbook](docs/runbooks/cluster-status.md)
- [Break-glass access runbook](docs/runbooks/break-glass-access.md)
- [Node rebuild runbook](docs/runbooks/node-rebuild.md)
- [Project standards](docs/standards.md)
- [Roadmap](docs/roadmap.md)
- [Architecture decisions](docs/decisions/README.md)

## Getting started

For orientation:

1. Review the current milestone in [docs/roadmap.md](docs/roadmap.md).
2. Run the [cluster status runbook](docs/runbooks/cluster-status.md) before
   large platform changes.
3. Read the accepted architecture decision records (ADRs).
4. Follow the conventions in [docs/standards.md](docs/standards.md).
5. Use a feature branch for changes and run validation before merging.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the change and release workflow.

## Version

Current version: **0.2.0**. See [CHANGELOG.md](CHANGELOG.md) for notable changes
and [docs/roadmap.md](docs/roadmap.md) for planned milestones.
