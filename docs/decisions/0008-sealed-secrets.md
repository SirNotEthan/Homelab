# ADR-0008: Use Sealed Secrets for GitOps-managed Kubernetes secrets

## Status

Accepted

## Context

The homelab now uses Argo CD to reconcile platform services from Git, but
several required Kubernetes Secrets are still created manually:

- the cert-manager Cloudflare API token;
- the Grafana administrator Secret;
- the Authentik application and PostgreSQL Secrets.

Plain Kubernetes Secret manifests are only base64 encoded, not encrypted, and
must not be committed to this public repository. The secret-management approach
must preserve GitOps while keeping plaintext credentials out of Git.

## Decision

Use Bitnami Sealed Secrets for Kubernetes Secret manifests that need to be
stored in this repository.

Plaintext Secrets are created locally, encrypted with the cluster's Sealed
Secrets public certificate, and committed as `SealedSecret` resources. The
controller in the cluster decrypts them into normal Kubernetes Secrets.

The controller private key is recovery-critical material. It must be backed up
outside Git and included in break-glass and disaster-recovery planning.

## Consequences

- Git can contain encrypted secret resources, but never plaintext Secret data.
- Argo CD can reconcile encrypted secret resources without needing access to
  plaintext values.
- Encrypted secrets are cluster-key dependent. If the controller private key is
  lost, existing sealed secret manifests cannot be decrypted by a rebuilt
  cluster.
- If the controller private key is exposed, every secret encrypted to that key
  must be treated as compromised and rotated.
- Secret rotation becomes a normal GitOps change: create a new plaintext Secret
  locally, seal it, commit the updated `SealedSecret`, and verify the consuming
  workload rolls out successfully.

## Alternatives considered

### Manual Kubernetes Secrets

This is the current bootstrap approach. It avoids putting secrets in Git, but
it leaves important state undocumented and unreproducible. It is acceptable for
bootstrap only.

### SOPS with age

SOPS is flexible and human-friendly, but Argo CD requires an additional
decryption integration. It remains a strong future option if secrets need to be
shared across non-Kubernetes systems.

### External Secrets Operator

External Secrets Operator is a good fit when a separate secret backend already
exists. The homelab does not yet have an external vault or password-manager
backend suitable for automated cluster reconciliation.

### HashiCorp Vault

Vault is powerful but introduces a separate high-availability and backup
problem. It is heavier than needed for the current homelab phase.
