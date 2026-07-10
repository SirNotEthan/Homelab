# ADR-0007: Use MetalLB for the Kubernetes ingress address

- Status: Accepted
- Date: 2026-07-10

## Context

Private services need a stable LAN address that split DNS can return for
browser-facing application names. The existing LAN is a single flat network
with the EE hub providing routing and DHCP. The Kubernetes cluster will run on
bare-metal nodes, so cloud load balancers are not available.

k3s includes a simple ServiceLB implementation, but it binds service ports on
cluster nodes rather than providing a dedicated service address from the
reserved private service block. The homelab needs a clear "cluster front door"
address for ingress and certificates.

## Decision

Use MetalLB in layer-2 mode for Kubernetes `LoadBalancer` services. Allocate a
small private address pool from the reserved service block maintained in the
private inventory. Do not publish the exact pool in this public repository.

Use one address from that pool as the initial ingress address. Configure split
DNS so `apps.lab.sirnotethan.uk` and `*.apps.lab.sirnotethan.uk` resolve to
that private ingress address. The ingress controller and cert-manager will then
serve HTTPS for private applications using the certificate approach from
[ADR-0006](0006-dns-certificates.md).

## Consequences

- Private application DNS has one stable target address.
- The address can move between Kubernetes nodes if the serving node changes.
- The LAN must keep the MetalLB pool outside DHCP and outside static host
  assignments.
- Layer-2 mode is simple and appropriate for the current flat LAN, but it is
  not a cross-subnet design.
- A future router or VLAN migration may require revisiting the advertisement
  mode and firewall rules.

## Alternatives considered

- k3s ServiceLB: deferred because it is convenient for simple services but does
  not provide the dedicated service address model wanted for split DNS.
- kube-vip: viable, especially for control-plane virtual IPs, but unnecessary
  for the first ingress milestone.
- Manually pin ingress to a node address: rejected because it couples service
  availability to one node and mixes host management addresses with service
  addresses.
