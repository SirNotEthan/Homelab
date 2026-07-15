# Backups

## Scope

Git protects reproducible configuration. Backups protect state that cannot be
recreated from Git: databases, documents, media, application metadata, and
encryption material required for recovery.

## Target strategy

Adopt a pragmatic local-first backup approach while the homelab is still being
built. `hp-utility-01` is the local target for k3s datastore backup copies.
Off-site object storage was evaluated and documented, but is deferred until the
platform contains data that justifies the extra operational overhead.

| Asset | Method | Target | Frequency | Retention | Status |
|---|---|---|---|---|---|
| Git configuration | Remote Git mirror | GitHub | On push | Repository history | Planned |
| k3s datastore | Offline SQLite archive | Local and backup host | Daily | 14 days local and backup host | Automated locally |
| Persistent volumes | Longhorn backup | Local or future backup target | Daily | TBD | Deferred |
| Authentik database | PostgreSQL dump plus Longhorn volume backup | Backup target | Daily | TBD | Planned |
| Grafana database | Declarative config plus database backup while manual config exists | Backup target | Daily or on change | TBD | Planned |
| Prometheus metrics | Longhorn volume backup if history is worth preserving | Backup target | Daily | Retention-limited | Planned |
| Loki logs | Longhorn volume backup if history is worth preserving | Backup target | Daily | Retention-limited | Planned |
| Databases | Application-aware dump | Backup target | Daily | TBD | Planned |
| Sealed Secrets controller key | Encrypted file backup | Private local storage | On rotation or controller replacement | Keep latest and prior key during migration | Local private backup exists |
| Documents/photos | File backup | Local target first; off-site later if needed | Daily | TBD | Planned |
| Grafana/app config | Export or declarative config | Git/backup target | On change | Version history | Planned |
| Open WebUI data | PVC backup or app export | Backup target | TBD | TBD | Planned if chat/upload history is retained |
| AI model cache | Re-download from model registry | None by default | On demand | N/A | Deferred |
| Custom assistant memory | Export plus encrypted backup | Backup target | TBD | TBD | Planned before production use |

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

The off-site backup target evaluation is tracked by
[ADR-0009](decisions/0009-offsite-backups.md) and is currently deferred.

Platform service health checks and service-specific backup expectations are
tracked in the [service catalogue](services.md).

AI storage and cache requirements are tracked in the
[local AI platform document](ai-platform.md).

## Never commit

Backup archives, database dumps, private user data, and backup credentials do
not belong in this repository. Only schedules, configuration templates, and
recovery documentation are versioned here.
