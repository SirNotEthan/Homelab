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

## Longhorn planning

Before adoption, document disk eligibility, replica count, capacity reservation,
node-drain behaviour, snapshot retention, and backup target credentials. The
cluster must tolerate the loss of one eligible storage node without losing a
healthy replicated volume.

## Open decisions

- Long-term bulk storage platform
- Longhorn replica count and reserved capacity
- Backup protocol and off-site destination
- Encryption at rest requirements
- Retention by data class
