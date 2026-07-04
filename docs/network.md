# Network

## Current topology

The EE hub is the only router and DHCP server. The Deco X20 mesh operates in
access-point mode and provides wireless coverage without creating another
subnet.

```text
Internet
  -> EE hub (router, firewall, DHCP and DNS forwarding)
    -> Deco X20 mesh (access-point mode)
      -> clients and homelab nodes
```

This replaced the original configuration in which the EE hub and Deco both
routed traffic, creating double NAT.

## IPv4 plan

| Setting | Value |
|---|---|
| LAN subnet | Private inventory (`/24`) |
| Gateway | Private inventory |
| DHCP server | Private inventory |
| DHCP pool | Private inventory |
| DHCP lease | 24 hours |
| DNS | Automatically selected by the EE hub |

Infrastructure addresses are outside the DHCP pool. Exact addresses are kept in
a private inventory rather than this public repository. They must be checked for
conflicts before assignment and configured declaratively on each host.

| Address class | Assignment | Status |
|---|---|---|
| Static infrastructure block | Network infrastructure | Reserved |
| Static host address | `m910q-01` | Active |
| Static host address | `m700-01` | Planned |
| Static host address | `m700-02` | Planned |
| Static host address | `m700-03` | Active |
| Static host address | `hp-utility-01` | Planned |
| Static service block | Kubernetes load-balancer pool | Reserved |
| Dynamic client block | General DHCP clients | Active |
| Gateway address | EE hub | Active |

The load-balancer range is reserved in the address plan only. Its implementation
will be selected and documented during the k3s milestone.

## Hostnames

| Host | Intended role | LAN assignment | Tailscale address |
|---|---|---|---|
| `m910q-01` | k3s control plane | Static, active | Active |
| `m700-01` | k3s worker | Static, private inventory | Planned |
| `m700-02` | k3s worker | Static, private inventory | Planned |
| `m700-03` | k3s worker/lab | Static, active | Active |
| `hp-utility-01` | Backup/utility | Static, private inventory | Planned |

## Access model

Wired Ethernet is the primary network for cluster nodes. Wi-Fi is removed from
the server configuration after wired access is verified. Tailscale remains the
planned remote management network; it does not replace LAN firewalling or
service authentication.

No management service is intentionally exposed to the public internet.

## IPv6

The EE hub currently provides globally routable IPv6 addresses through router
advertisements. No homelab service should rely on a stable IPv6 address until an
IPv6 addressing and firewall policy has been documented and tested.

## DNS and ingress

No domain is currently owned. `home.arpa` is the candidate private namespace,
but the internal resolver and certificate strategy remain undecided. Publicly
trusted certificates, a private certificate authority, and Tailscale-provided
names will be evaluated before ingress is considered stable.

## Planned segmentation

VLANs are a future enhancement, not a v0.2 dependency. Likely trust zones are
management, trusted clients, servers, IoT, and guests. Firewall rules should be
documented as allowed flows rather than broad trust between zones.

## Open decisions

- Internal DNS resolver and domain strategy
- Certificate issuer and trust distribution
- Kubernetes Service and Pod CIDRs
- Load-balancer implementation
- IPv6 addressing and firewall policy
- Whether cluster storage traffic requires a dedicated network
