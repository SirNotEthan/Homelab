# Architecture

## Purpose

The homelab is designed as a small, reproducible cloud platform. Git describes
the desired state; automation applies it; monitoring reports whether reality
matches that intent.

## Architecture principles

- Nodes are replaceable. Persistent data is protected independently of a node.
- Cluster and service configuration is declarative and reviewed in Git.
- Platform capabilities are separated from user-facing applications.
- Administrative access uses a private management path.
- A service is not complete until it has monitoring, backup, and recovery plans.

## Layers

```text
Hardware
  -> Ubuntu Server
    -> k3s
      -> Infrastructure services
        -> Platform services
          -> Applications
```

| Layer | Responsibility | Examples |
|---|---|---|
| Hardware | Compute and local disks | ThinkCentre nodes, HP utility host |
| Operating system | Minimal host environment | Ubuntu Server, SSH, Tailscale |
| Cluster | Scheduling and orchestration | k3s server and agents |
| Infrastructure | Networking and durable storage | Traefik, certificates, Longhorn |
| Platform | Shared operational capabilities | Argo CD, Authentik, observability |
| Applications | User-facing workloads | Homepage, Immich, Jellyfin |

## Target topology

`m910q-01` is the initial k3s control-plane node. The three M700 systems are
workers, with `m700-03` also available for experimental workloads. This is not a
high-availability control plane; losing `m910q-01` requires control-plane
recovery until additional server nodes are introduced.

`hp-utility-01` is outside the cluster failure domain and is intended to hold
backup copies and utility services. Its use as a backup target does not by
itself satisfy the planned off-site copy requirement.

## Desired-state flow

1. A change is made on a feature branch.
2. Validation and review run before merge.
3. `main` represents the stable desired state.
4. Argo CD reconciles Kubernetes resources from Git.
5. Monitoring reports health and drift; it does not silently redefine desired
   state.

Bootstrap and host configuration that must exist before Argo CD are managed by
scripts and Ansible. Terraform is reserved for infrastructure with a suitable
external API; it is not required merely for consistency.

## Failure domains and limitations

- The initial single control plane is a known availability risk.
- Longhorn replication cannot replace an independent backup.
- Tailscale availability is required for the planned remote administration path.
- A single physical site remains vulnerable until off-site backups are active.
- Address allocation and the DNS/certificate approach are documented; storage
  sizing and later network segmentation remain roadmap work.

## Related documents

- [Network](network.md)
- [Security](security.md)
- [Storage](storage.md)
- [Backups](backups.md)
- [Disaster recovery](disaster-recovery.md)
- [Architecture decisions](decisions/README.md)
