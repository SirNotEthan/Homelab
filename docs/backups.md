# Backups

## Scope

Git protects reproducible configuration. Backups protect state that cannot be
recreated from Git: databases, documents, media, application metadata, and
encryption material required for recovery.

## Target strategy

Adopt a 3-2-1 approach: three copies, on two media or systems, with one copy
off-site. `hp-utility-01` is the local target. The proposed off-site target is
S3-compatible object storage, with Backblaze B2 as the initial recommended
provider.

| Asset | Method | Target | Frequency | Retention | Status |
|---|---|---|---|---|---|
| Git configuration | Remote Git mirror | GitHub | On push | Repository history | Planned |
| k3s datastore | Offline SQLite archive plus restic copy | Local, backup host, and off-site object storage | Daily | 14 days local and backup host; off-site TBD | Local automated; off-site planned |
| Persistent volumes | Longhorn backup | S3-compatible object storage | Daily | TBD | Planned |
| Authentik database | PostgreSQL dump plus Longhorn volume backup | Backup target | Daily | TBD | Planned |
| Grafana database | Declarative config plus database backup while manual config exists | Backup target | Daily or on change | TBD | Planned |
| Prometheus metrics | Longhorn volume backup if history is worth preserving | Backup target | Daily | Retention-limited | Planned |
| Loki logs | Longhorn volume backup if history is worth preserving | Backup target | Daily | Retention-limited | Planned |
| Databases | Application-aware dump | Backup target | Daily | TBD | Planned |
| Sealed Secrets controller key | Encrypted file backup | Private local storage and off-site object storage | On rotation or controller replacement | Keep latest and prior key during migration | Local private backup exists; off-site planned |
| Documents/photos | File backup | Local and off-site | Daily | TBD | Planned |
| Grafana/app config | Export or declarative config | Git/backup target | On change | Version history | Planned |

Frequencies and retention are provisional until data value and available
capacity are measured.

## Backup requirements

- Encrypt backup data in transit and at rest where the target is not trusted.
- Keep backup credentials separate from workload credentials.
- Alert on missed jobs, stale copies, and capacity exhaustion.
- Protect at least one copy from routine cluster credentials and deletion.
- Record tool versions and any encryption keys required to restore.

## Verification

A successful job is not sufficient proof. Each critical data class must have a
documented restore procedure and periodic restore test. Record the date,
duration, result, and corrective actions from every test.

The first k3s SQLite datastore backup was created offline, verified by listing
the archive contents, and copied to the backup host. A daily systemd timer now
creates and copies the backup with 14-day local and backup-host retention.
Restore is not yet tested. See
[k3s datastore backup runbook](runbooks/k3s-datastore-backup.md).

The off-site backup target is tracked by
[ADR-0009](decisions/0009-offsite-backups.md). The implementation process is in
the [off-site backups runbook](runbooks/offsite-backups.md).

Platform service health checks and service-specific backup expectations are
tracked in the [service catalogue](services.md).

## Never commit

Backup archives, database dumps, private user data, and backup credentials do
not belong in this repository. Only schedules, configuration templates, and
recovery documentation are versioned here.
