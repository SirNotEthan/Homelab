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
| Static host address | `m700-01` | Active |
| Static host address | `m700-02` | Active |
| Static host address | `m700-03` | Active |
| Static host address | `hp-utility-01` | Active |
| Static service block | Kubernetes load-balancer pool | Reserved |
| Dynamic client block | General DHCP clients | Active |
| Gateway address | EE hub | Active |

The load-balancer range is reserved in the address plan only. Kubernetes
`LoadBalancer` services will use MetalLB in layer-2 mode with exact addresses
kept in the private inventory. See
[ADR-0007](decisions/0007-kubernetes-load-balancer.md).

## Hostnames

| Host | Intended role | LAN assignment | Tailscale address |
|---|---|---|---|
| `m910q-01` | k3s control plane | Static, active | Active |
| `m700-01` | k3s worker | Static, active | Active |
| `m700-02` | k3s worker | Static, active | Active |
| `m700-03` | k3s worker/lab | Static, active | Active |
| `hp-utility-01` | Backup/utility | Static, private inventory | Active |

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

The registered domain is `sirnotethan.uk`. Private applications use the split
DNS namespace `lab.sirnotethan.uk`; host administration continues to use
Tailscale MagicDNS.

Cloudflare is authoritative publicly but does not publish private application
addresses. An Ansible-managed resolver on `hp-utility-01` will answer the
private application zone for approved LAN and Tailscale clients. cert-manager
will obtain Let's Encrypt certificates through Cloudflare DNS-01 challenges,
so no inbound router ports are required. See
[ADR-0006](decisions/0006-dns-certificates.md).

The initial private DNS implementation is an Ansible-managed `dnsmasq`
resolver on `hp-utility-01`. The resolver is reachable over both LAN and
Tailscale for approved clients. Exact resolver and service addresses are kept
in the private inventory.

Split DNS resolves `apps.lab.sirnotethan.uk` and
`*.apps.lab.sirnotethan.uk` to the private MetalLB ingress address when clients
query the homelab resolver. Client-wide or Tailscale split DNS configuration is
tracked separately from resolver deployment.

## Planned segmentation

VLANs are a future enhancement, not a v0.2 dependency. Likely trust zones are
management, trusted clients, servers, IoT, and guests. Firewall rules should be
documented as allowed flows rather than broad trust between zones.

## Open decisions

- Kubernetes Service and Pod CIDRs
- IPv6 addressing and firewall policy
- Whether cluster storage traffic requires a dedicated network
