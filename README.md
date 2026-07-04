# Homelab

> A personal cloud platform built with Kubernetes, GitOps, and Infrastructure as Code.

This repository is the source of truth for the homelab. It contains the
documentation, infrastructure definitions, and recovery procedures needed to
understand and rebuild the platform without relying on terminal history or
memory.

## Current status

Version **0.1.0** establishes the repository structure and documents the
intended architecture. Infrastructure automation and cluster deployment are
planned work; the repository does not yet represent a production-ready system.

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

- Ubuntu Server and k3s
- Traefik ingress and certificate management
- Tailscale remote administration
- Argo CD GitOps reconciliation
- Longhorn distributed storage
- Prometheus, Grafana, and Loki observability
- Authentik single sign-on
- Homepage service dashboard

Applications listed in [docs/services.md](docs/services.md) are candidates, not
all currently deployed services.

## Repository layout

| Path | Purpose |
|---|---|
| `ansible/` | Host configuration and repeatable operating-system changes |
| `bootstrap/` | First-run host and cluster bootstrap tooling |
| `docs/` | Architecture, operations, standards, and decisions |
| `homepage/` | Homepage dashboard configuration |
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
- [Node rebuild runbook](docs/runbooks/node-rebuild.md)
- [Project standards](docs/standards.md)
- [Roadmap](docs/roadmap.md)
- [Architecture decisions](docs/decisions/README.md)

## Getting started

The repository is currently in its documentation phase. Before deploying
anything:

1. Review the hardware inventory and fill in missing network information.
2. Read the accepted architecture decision records (ADRs).
3. Follow the conventions in `docs/standards.md`.
4. Use a feature branch for changes and run `make validate` before merging.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the change and release workflow.

## Version

Current version: **0.1.0**. See [CHANGELOG.md](CHANGELOG.md) for notable changes
and [docs/roadmap.md](docs/roadmap.md) for planned milestones.
