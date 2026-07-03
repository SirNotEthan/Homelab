# Hardware

This inventory records the known physical baseline. Confirm firmware versions,
disk health, and actual installed memory before automation depends on them.

| Host | Model | CPU | RAM | Storage | Role |
|---|---|---|---|---|---|
| m910q-01 | Lenovo ThinkCentre M910q | i5-6500T | 16GB | 256GB SSD | k3s control plane |
| m700-01 | Lenovo ThinkCentre M700 | i3-6100 | 8GB | 120GB SSD | k3s worker |
| m700-02 | Lenovo ThinkCentre M700 | i3-6100 | 8GB | 120GB SSD | k3s worker |
| m700-03 | Lenovo ThinkCentre M700 | i3-6100 | 8GB | 120GB SSD | k3s worker/lab |
| hp-utility-01 | HP Pavilion qa111na | AMD A10-8700P | 8GB | 2TB HDD | backup/utility |

## Host baseline

- Ubuntu Server LTS version: TBD
- Firmware and BIOS configuration: TBD
- SSH access: key-based
- Remote administration: Tailscale
- Time synchronization: distribution default, to be verified
- Disk-health monitoring: planned

## Placement constraints

- `m910q-01` initially hosts the only k3s control plane.
- `m700-03` may be tainted or labelled for experimental workloads.
- `hp-utility-01` remains outside the cluster so local backups do not share the
  Kubernetes control-plane failure domain.
- Stateful workload placement must account for actual disk capacity and health.

## To record before bootstrap

- System serial numbers in a private inventory, if required for warranty use
- BIOS versions and important settings
- Network interface MAC addresses in a private inventory
- SMART health and usable disk capacity
- UPS coverage and shutdown behaviour
