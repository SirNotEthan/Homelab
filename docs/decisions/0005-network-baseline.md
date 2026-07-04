# ADR-0005: Use the EE hub as the single LAN router

- Status: Accepted
- Date: 2026-07-04

## Context

The EE ISP hub and Deco X20 mesh originally both operated as routers on separate
private subnets. This double-NAT topology complicated address management, DNS,
service exposure, and troubleshooting.

The homelab needs predictable addresses without introducing a replacement
router or VLAN design during its host-baseline milestone.

## Decision

Use the EE hub as the only LAN router, firewall, DHCP server, and initial DNS
forwarder. Operate the Deco X20 mesh in access-point mode.

Retain the EE hub's `/24` private network and existing DHCP service. Configure
server addresses declaratively outside the DHCP pool and reserve a separate
static block for a future Kubernetes load-balancer implementation. Exact
addresses and ranges are maintained in a private inventory outside this public
repository.

Cluster nodes use wired Ethernet. Tailscale will provide remote management after
the local host baseline is reproducible.

## Consequences

- The LAN has one routing and DHCP authority, removing double NAT.
- The Deco mesh provides Wi-Fi only; its router-only controls are unavailable.
- Static host addresses do not depend on the EE hub's reservation interface.
- The EE hub remains an infrastructure dependency and limits advanced routing
  policy until a dedicated router is adopted.
- IPv6, internal DNS, certificates, and VLANs still require separate decisions.

## Alternatives considered

- Keep the Deco in router mode behind the EE hub: rejected because it preserves
  double NAT.
- Place the EE hub in bridge mode or replace it immediately: deferred because it
  adds migration risk before the host baseline exists.
- Use only dynamic addresses: rejected because cluster infrastructure requires
  predictable management endpoints.
