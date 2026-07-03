# ADR-0003: Use Homepage as the service dashboard

- Status: Accepted
- Date: 2026-07-03

## Context

A lightweight landing page is needed to discover services and display basic
platform health. Its configuration must be reviewable and reproducible from Git.

## Decision

Use Homepage as the dashboard. Store its non-secret configuration under
`homepage/` and deploy it through Kubernetes and GitOps when those layers exist.

## Consequences

- Dashboard changes are versioned instead of being edited only in a web UI.
- Integrations may require credentials that must be supplied through the chosen
  secrets-management solution.
- Homepage is a convenience interface, not a monitoring or identity system.

## Alternatives considered

- Homarr and custom dashboards were considered, but Homepage better matches the
  initial preference for a lightweight, file-configured service.
