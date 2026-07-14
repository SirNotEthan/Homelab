# Hardware

This inventory records the known physical baseline. Confirm firmware versions,
disk health, and actual installed memory before automation depends on them.

| Host | Model | CPU | RAM | Storage | Role |
|---|---|---|---|---|---|
| m910q-01 | Lenovo ThinkCentre M910q | i5-6500T | 16GB | 256GB SSD | k3s control plane |
| m700-01 | Lenovo ThinkCentre M700 | i3-6100 | 8GB | 120GB SSD | k3s worker |
| m700-02 | Lenovo ThinkCentre M700 | i3-6100 | 8GB | 120GB SSD | k3s worker |
| m700-03 | Lenovo ThinkCentre M700 Tiny | i3-6100 | 8GB | 120GB SSD | k3s worker/lab |
| hp-utility-01 | HP Pavilion qa111na | AMD A10-8700P | 8GB | 2TB HDD | backup/utility |

## Verified node baseline

| Host | OS | Firmware | Network | Root filesystem | Verified |
|---|---|---|---|---|---|
| `m910q-01` | Ubuntu Server 26.04 LTS | `M1AKT5AA` | Static Ethernet | 232 GB | 2026-07-04 |
| `m700-01` | Ubuntu Server 26.04 LTS | `FWKTBFA` | Static Ethernet | 115 GB | 2026-07-04 |
| `m700-02` | Ubuntu Server 26.04 LTS | `FWKTBFA` | Static Ethernet | 115 GB | 2026-07-04 |
| `m700-03` | Ubuntu Server 26.04 LTS | `FWKTBFA` | Static Ethernet | 106.7 GB | 2026-07-04 |

The verified installations use UEFI boot, Secure Boot, wired networking,
key-only SSH, Tailscale, and the full intended LVM volume. NVMe SMART health
passed on `m910q-01`. The `m700-03` is the manual pilot and `m910q-01` is the
first node recovered with the automated host baseline. The `m700-01` recovery
provided the first complete timing measurement.

## k3s node baseline

| Host | k3s role | Status |
|---|---|---|
| `m910q-01` | control plane | Ready |
| `m700-01` | worker | Ready |
| `m700-02` | worker | Ready |
| `m700-03` | worker | Ready |

All nodes joined the initial k3s cluster on Ubuntu 26.04 LTS with k3s
`v1.36.2+k3s1` and containerd `2.3.2-k3s2`.

## Target host baseline

- Ubuntu Server 26.04 LTS
- Current vendor firmware applied before cluster installation
- UEFI boot with Secure Boot enabled and Legacy/CSM disabled
- SSH access: key-based
- Remote administration: Tailscale
- Time synchronization: distribution default, to be verified
- Disk-health monitoring: planned

## Placement constraints

- `m910q-01` initially hosts the only k3s control plane.
- `m700-03` is labelled for AI/lab workloads with
  `homelab.sirnotethan.uk/workload=ai` and
  `homelab.sirnotethan.uk/ai=true`.
- `hp-utility-01` remains outside the cluster so local backups do not share the
  Kubernetes control-plane failure domain.
- Stateful workload placement must account for actual disk capacity and health.

## To verify on remaining hosts

- System serial numbers in a private inventory, if required for warranty use
- BIOS versions and important settings
- Network interface MAC addresses in a private inventory
- SMART health and usable disk capacity
- UPS coverage and shutdown behaviour
