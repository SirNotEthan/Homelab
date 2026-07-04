# ADR-0006: Use split DNS and public certificates for private services

- Status: Accepted
- Date: 2026-07-04

## Context

Browser-facing homelab services require stable names and trusted HTTPS without
being exposed to the public internet. The special-use `home.arpa` namespace
would require a private certificate authority and trust installation on every
client. Tailscale MagicDNS provides useful host names, but it is not the
long-term application namespace for Kubernetes ingress.

The public domain `sirnotethan.uk` is registered with Cloudflare. Exact LAN and
Tailscale addresses remain private inventory data.

## Decision

Use `lab.sirnotethan.uk` as the private application namespace. Continue using
Tailscale MagicDNS names for host administration.

Cloudflare remains the public authoritative DNS provider. Do not publish
application A or AAAA records in the public zone and do not proxy private
services through Cloudflare. Public DNS contains only ordinary domain
administration records and temporary ACME DNS-01 challenge records.

Provide split DNS for `lab.sirnotethan.uk` from an Ansible-managed `dnsmasq`
resolver on `hp-utility-01`, outside the Kubernetes failure domain. Service
records resolve to the private Kubernetes ingress address held in the private
inventory. Configure approved LAN clients directly and configure Tailscale
split DNS to forward this zone to the resolver. A secondary resolver can be
added later if service-DNS availability warrants it.

Use cert-manager with Let's Encrypt and the Cloudflare DNS-01 solver. Default
ingress certificates cover `lab.sirnotethan.uk` and
`*.lab.sirnotethan.uk`. Use a Cloudflare API token restricted to this zone with
`Zone:DNS:Edit` and `Zone:Zone:Read`; never use the global API key. Store the
token in the cluster's secret-management system and reference it from the
declarative issuer configuration. The token and generated private keys never
belong in Git.

Enable registrar auto-renewal, account MFA, registrar lock, WHOIS redaction,
and DNSSEC for the public zone.

## Consequences

- Browsers can trust service certificates without a locally installed CA.
- DNS-01 proves domain control without opening inbound router ports.
- Private service names and addresses are not published through public DNS.
- Certificate Transparency exposes the registered domain and wildcard
  certificate names, but not each service name covered by the wildcard.
- Service-name resolution depends initially on `hp-utility-01`; management and
  recovery remain available through Tailscale MagicDNS if it is unavailable.
- The Cloudflare token can modify DNS in one zone and must be protected,
  rotated, and recoverable independently of the cluster.

## Alternatives considered

- `home.arpa` with a private CA: rejected for browser-facing services because
  every client would require a private trust root and its lifecycle.
- Tailscale `*.ts.net` names for all services: retained for host management but
  rejected as the primary ingress namespace because not every future LAN
  client will run Tailscale.
- Public A or AAAA records containing private addresses: rejected because they
  disclose internal addressing and may be blocked by DNS-rebinding protection.
- HTTP-01 certificate challenges: rejected because they require public ingress
  reachability.
