# Storage

## Current inventory

Each cluster node uses a local SSD. `hp-utility-01` has a 2 TB HDD and is the
planned local backup target. Exact usable capacity and disk health must be
verified before workloads are placed on them.

## Target storage classes

| Data type | Target | Notes |
|---|---|---|
| Ephemeral application data | Node-local | Safe to recreate |
| Kubernetes persistent volumes | Longhorn | Replicated across eligible nodes |
| Databases | Longhorn plus app-aware backup | Crash-consistent snapshots alone may be insufficient |
| Media and documents | To be decided | Capacity and performance requirements need measurement |
| Backup copies | `hp-utility-01` plus off-site target | Separate from the cluster failure domain |

## Principles

- Replication improves availability; it is not a backup.
- Stateful services declare capacity, performance, backup, and restore needs.
- Storage consumers use named storage classes rather than depending on a node.
- Disk health, capacity, and volume health are monitored with actionable alerts.
- Destructive migrations require a tested rollback or restore path.

## Longhorn baseline

Longhorn is installed as the Kubernetes persistent-volume provider for the k3s
cluster. The default storage class is `longhorn-2replica`, which provisions
volumes with two replicas across eligible cluster nodes.

Baseline settings:

- default application storage class: `longhorn-2replica`;
- replica count for new application volumes: `2`;
- volume expansion: enabled;
- reclaim policy: `Delete`;
- filesystem type: `ext4`;
- backup target: not yet configured; the proposed target is S3-compatible
  object storage.

Validation evidence:

- Longhorn control-plane, CSI, engine image, instance manager, and UI pods
  reported `Running`.
- All Kubernetes cluster nodes reported `Ready`, schedulable Longhorn nodes.
- A smoke-test PVC using `longhorn-2replica` bound successfully.
- A smoke-test pod mounted the PVC and wrote data successfully.
- The Longhorn volume reported `attached` and `healthy`.
- The smoke-test volume created exactly two running replicas on separate
  eligible nodes.

The older `longhorn` storage class may still exist for compatibility with
Longhorn defaults, but it is not the default class for new workloads.

## Open decisions

- Long-term bulk storage platform
- Backup protocol and off-site destination proposed in
  [ADR-0009](decisions/0009-offsite-backups.md)
- Encryption at rest requirements
- Retention by data class
