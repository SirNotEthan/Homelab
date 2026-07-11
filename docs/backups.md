# Backups

## Scope

Git protects reproducible configuration. Backups protect state that cannot be
recreated from Git: databases, documents, media, application metadata, and
encryption material required for recovery.

## Target strategy

Adopt a 3-2-1 approach: three copies, on two media or systems, with one copy
off-site. `hp-utility-01` is the planned local target; the off-site target is
still to be selected.

| Asset | Method | Target | Frequency | Retention | Status |
|---|---|---|---|---|---|
| Git configuration | Remote Git mirror | GitHub | On push | Repository history | Planned |
| k3s datastore | Offline SQLite archive | Local and backup host | Manual | TBD | First backup complete |
| Persistent volumes | Longhorn backup | Backup target | Daily | TBD | Planned |
| Databases | Application-aware dump | Backup target | Daily | TBD | Planned |
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
the archive contents, and copied to the backup host. Restore is not yet tested.
See [k3s datastore backup runbook](runbooks/k3s-datastore-backup.md).

## Never commit

Backup archives, database dumps, private user data, and backup credentials do
not belong in this repository. Only schedules, configuration templates, and
recovery documentation are versioned here.
