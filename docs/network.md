# Network

## Goals

- Stable names and addresses for infrastructure components.
- No direct public exposure of administrative interfaces.
- Predictable internal DNS and HTTPS for services.
- Enough separation to introduce VLANs without renaming the platform.

## Hostnames

| Host | Intended role | LAN address | Tailscale address |
|---|---|---|---|
| `m910q-01` | k3s control plane | TBD | Assigned by Tailscale |
| `m700-01` | k3s worker | TBD | Assigned by Tailscale |
| `m700-02` | k3s worker | TBD | Assigned by Tailscale |
| `m700-03` | k3s worker/lab | TBD | Assigned by Tailscale |
| `hp-utility-01` | Backup/utility | TBD | Assigned by Tailscale |

Record address reservations here before cluster bootstrap. Secrets, auth keys,
and device credentials must never be added to this table.

## Access model

Tailscale is the initial management network for SSH and private administration.
Access-control policy should permit only the minimum required users and devices.
The LAN remains the data path for local cluster traffic unless later testing
justifies a different design.

## DNS and ingress

The internal domain, DNS provider, service IP strategy, and certificate issuer
are not yet selected. The target design is:

- friendly internal service names;
- HTTPS for browser-facing services;
- no split-brain naming between local and remote access; and
- automated certificate renewal.

These decisions must be recorded in ADRs before ingress is treated as stable.

## Planned segmentation

VLANs are a future enhancement, not a v0.1 dependency. Likely trust zones are
management, trusted clients, servers, IoT, and guests. Firewall rules should be
documented as allowed flows rather than broad trust between zones.

## Open decisions

- LAN subnet and DHCP reservation range
- Internal domain
- Kubernetes Service and Pod CIDRs
- Load-balancer implementation and address pool
- DNS resolver and certificate issuer
- Whether cluster storage traffic requires a dedicated network
