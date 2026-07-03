# Project standards

These conventions keep new infrastructure consistent and make automation easier
to reason about. Propose exceptions through an ADR.

## Naming

- Hosts: lowercase `<model>-<two-digit-number>`, for example `m700-01`.
- Kubernetes objects and namespaces: lowercase DNS labels with hyphens.
- Files and directories: lowercase kebab-case unless a tool requires otherwise.
- Environment-specific files: use a clearly named directory or suffix; do not
  encode secrets in filenames.

## Kubernetes namespaces

| Namespace | Intended contents |
|---|---|
| `infrastructure` | Ingress, certificates, networking, and storage |
| `platform` | GitOps, identity, and shared platform capabilities |
| `monitoring` | Metrics, dashboards, logging, and alerting |
| `development` | Development environments and tools |
| `media` | Media-management and streaming workloads |
| `personal` | Other personal applications |

Create a dedicated namespace when a service has materially different access,
lifecycle, or policy requirements. Do not place user workloads in `default`.

## Kubernetes resources

- Use stable labels recommended by Kubernetes: `app.kubernetes.io/name`,
  `app.kubernetes.io/instance`, `app.kubernetes.io/component`, and
  `app.kubernetes.io/managed-by` where applicable.
- Set CPU and memory requests. Add limits after observing real usage and avoiding
  unsafe throttling or out-of-memory behaviour.
- Pin images to a reviewed version. Avoid `latest`.
- Define health probes for services that support them.
- Keep secrets out of plain-text manifests.
- Add comments for non-obvious constraints, not for syntax the manifest states.

## Repository organisation

- `kubernetes/infrastructure/` contains cluster plumbing.
- `kubernetes/platform/` contains shared operational services.
- `kubernetes/applications/` contains user-facing workloads.
- Each component should contain a short README describing purpose, dependencies,
  deployment, validation, rollback, and data recovery.
- Generated files must identify their source and regeneration command.

## Ports and exposure

- Prefer service discovery and ingress names over fixed host ports.
- Document every host port and why it is required.
- Administrative interfaces remain private by default.
- Public exposure requires an ADR or equivalent threat review.

## Documentation

- Use Markdown with one sentence per line only when it improves diffs; otherwise
  wrap naturally and consistently.
- Use `TBD` for a known undecided value, with a roadmap item or ADR to close it.
- Distinguish current state from target state.
- Update diagrams, runbooks, and changelog alongside behaviour changes.

## Git

- `main` is stable and represents deployable desired state.
- Use short-lived branches such as `feature/homepage` and `fix/dns-timeout`.
- Prefer small, reviewable commits with imperative messages.
- Never commit credentials, personal backup data, or generated archives.
