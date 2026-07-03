# ADR-0004: Adopt GitOps with Argo CD

- Status: Accepted
- Date: 2026-07-03

## Context

The cluster must be reproducible, changes must be reviewable, and configuration
drift should be visible. Manual application changes make disaster recovery and
auditability weaker.

## Decision

Treat `main` as the stable desired state and use Argo CD to reconcile Kubernetes
configuration from this repository. Bootstrap components that precede Argo CD
remain automated through scripts or Ansible.

## Consequences

- Pull requests provide a reviewable change history and rollback point.
- Manual in-cluster changes may be reverted and should be reserved for incident
  response, then captured in Git.
- Repository and Argo CD access become sensitive security boundaries.
- Secrets require a Git-compatible encrypted or externally managed approach.

## Alternatives considered

- Manual `kubectl apply`: simple initially, but poor at drift detection and
  repeatable recovery.
- Flux: a strong alternative; Argo CD is chosen for its desired user interface
  and application-oriented operational model.
