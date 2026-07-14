# ADR-0009: Use S3-compatible object storage for off-site backups

## Status

Proposed

## Context

The homelab already creates local k3s datastore backups and copies them to
`hp-utility-01`. This protects against a single cluster-node failure, but it
does not protect against site loss, theft, fire, broad ransomware impact, or
operator error that reaches both the cluster and local backup host.

The platform also needs a backup target for Longhorn persistent volumes and
future application-aware database dumps.

## Decision

Use an S3-compatible object storage provider as the first off-site backup
target.

The initial recommended provider is Backblaze B2 because it is S3-compatible,
cost-effective for small homelab backup volumes, and supported by common backup
tools. The exact provider, region, bucket name, and access keys must be created
outside Git.

Use:

- `restic` for encrypted file/object backups such as k3s backup archives,
  database dumps, Sealed Secrets controller key backups, and selected utility
  host data;
- Longhorn's S3-compatible backup target support for Kubernetes persistent
  volume backups.

## Consequences

- Off-site backups are encrypted before they leave trusted systems.
- Backup credentials become critical secrets and must be stored outside Git,
  preferably as SealedSecrets when used by Kubernetes workloads.
- Backup restore tests are required before the off-site target is considered
  production-ready.
- Longhorn backup retention must be managed by Longhorn, not by deleting objects
  directly from the object storage bucket.
- Provider pricing and region choices must be reviewed before creating the
  account and bucket.

## Alternatives considered

### Local-only backups

Already partially implemented, but insufficient for disaster recovery because
the backup host is in the same physical site.

### Consumer file sync

Simple to start, but harder to automate safely, audit, and integrate with
Longhorn. It also risks accidental deletion propagation.

### Dedicated backup appliance or NAS replication

Useful later, but does not by itself satisfy the off-site copy requirement.

### Cloud provider object storage other than Backblaze B2

AWS S3, Cloudflare R2, Wasabi, and other S3-compatible targets remain valid
alternatives. The homelab should keep the implementation portable where
possible.

## References

- [Backblaze B2 Cloud Storage pricing](https://www.backblaze.com/cloud-storage/pricing)
- [restic repository setup documentation](https://restic.readthedocs.io/en/latest/030_preparing_a_new_repo.html)
- [Longhorn S3 backup target documentation](https://longhorn.io/docs/1.12.0/snapshots-and-backups/backup-and-restore/set-backup-target/)
