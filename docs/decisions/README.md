# Architecture decision records

Architecture decision records (ADRs) preserve why a significant choice was made,
including its trade-offs.

## Index

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-k3s.md) | Use k3s as the Kubernetes distribution | Accepted |
| [0002](0002-tailscale.md) | Use Tailscale for remote administration | Accepted |
| [0003](0003-homepage.md) | Use Homepage as the service dashboard | Accepted |
| [0004](0004-gitops.md) | Adopt GitOps with Argo CD | Accepted |
| [0005](0005-network-baseline.md) | Use the EE hub as the single LAN router | Accepted |
| [0006](0006-dns-certificates.md) | Use split DNS and public certificates for private services | Accepted |
| [0007](0007-kubernetes-load-balancer.md) | Use MetalLB for the Kubernetes ingress address | Accepted |
| [0008](0008-sealed-secrets.md) | Use Sealed Secrets for GitOps-managed Kubernetes secrets | Accepted |
| [0009](0009-offsite-backups.md) | Use S3-compatible object storage for off-site backups | Proposed |

## Lifecycle

New ADRs use the next four-digit sequence number. A decision begins as
`Proposed`, then becomes `Accepted`, `Rejected`, `Deprecated`, or `Superseded`.
Do not rewrite an accepted decision to hide its original context; create a new
ADR and link both records.

Each ADR should contain status, context, decision, consequences, and alternatives
considered.
