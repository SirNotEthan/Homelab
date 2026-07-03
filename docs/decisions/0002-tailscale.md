# ADR-0002: Use Tailscale for remote administration

- Status: Accepted
- Date: 2026-07-03

## Context

The homelab requires secure remote SSH and management access without publishing
administrative ports or maintaining a manually exposed VPN endpoint.

## Decision

Use Tailscale as the initial private management network for hosts and approved
administrative devices. Apply least-privilege access controls and require MFA at
the identity provider.

## Consequences

- Administrative services can remain off the public internet.
- Device enrolment and access policy become explicit and auditable.
- Remote management depends on Tailscale and its identity integration.
- Tailscale access does not replace LAN firewalling, service authentication, or
  a recovery path for the Tailscale account.

## Alternatives considered

- Port-forwarded SSH: rejected because it unnecessarily exposes management.
- Self-hosted WireGuard: viable, but adds key distribution and endpoint
  availability work before the core platform exists.
