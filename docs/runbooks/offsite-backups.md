# Off-site backups runbook

## Purpose

This runbook records the process for adding an encrypted off-site backup target.
It complements the local k3s datastore backup process; it does not replace it.

The first planned target is S3-compatible object storage. Backblaze B2 is the
initial recommended provider, but the implementation should remain portable to
other S3-compatible providers where practical.

## Sensitive material

Do not commit any of the following:

- object storage access keys;
- bucket names if they reveal private infrastructure details;
- restic repository passwords;
- restic environment files;
- backup archives or restored data;
- Sealed Secrets controller private-key backups.

Store operational credentials in the private notes location documented in the
break-glass runbook and in root-owned files on the machine that performs the
backup.

## Target layout

Use separate prefixes for different backup classes:

| Prefix | Purpose |
|---|---|
| `k3s/` | k3s SQLite datastore backup archives copied to `hp-utility-01` |
| `longhorn/` | Longhorn persistent-volume backups |
| `secrets/` | Encrypted copies of critical recovery material |
| `dumps/` | Future application-aware database dumps |

## Phase 1: create the off-site bucket

Complete this outside the repository:

1. Create the object storage account.
2. Create one private bucket for homelab backups.
3. Enable provider-side object encryption if available.
4. Create an application key scoped to the backup bucket only.
5. Record the endpoint, region, bucket name, key ID, and secret key in the
   private notes location.

For Backblaze B2, prefer an S3-compatible application key with the minimum
bucket permissions needed to write, read, and list backup objects.

## Phase 2: configure restic on the backup host

`hp-utility-01` is the first off-site backup sender because it already receives
copies of the k3s datastore backups.

Install restic:

```bash
sudo apt-get update
sudo apt-get install -y restic
```

Create a root-only environment file:

```bash
sudo install -d -m 700 -o root -g root /root/.config/homelab
sudo install -m 600 -o root -g root /dev/null /root/.config/homelab/restic-offsite.env
sudoedit /root/.config/homelab/restic-offsite.env
```

Use placeholders like this; replace them on the host only:

```bash
RESTIC_REPOSITORY=s3:https://<s3-endpoint>/<bucket-name>/restic
AWS_ACCESS_KEY_ID=<bucket-key-id>
AWS_SECRET_ACCESS_KEY=<bucket-secret-key>
RESTIC_PASSWORD=<long-random-restic-password>
```

Initialise the repository once from a root shell:

```bash
sudo -i
set -a
. /root/.config/homelab/restic-offsite.env
set +a
restic init
exit
```

## Phase 3: back up k3s archives off-site

Run the first backup from `hp-utility-01`:

```bash
sudo -i
set -a
. /root/.config/homelab/restic-offsite.env
set +a

restic backup /srv/homelab-backups/k3s \
  --tag k3s-datastore \
  --tag hp-utility-01

restic snapshots
restic check
exit
```

Suggested retention once the first restore test passes:

```bash
sudo -i
set -a
. /root/.config/homelab/restic-offsite.env
set +a

restic forget \
  --tag k3s-datastore \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 12 \
  --prune

exit
```

## Phase 4: test restore from restic

Restore into a temporary directory, not over live data:

```bash
sudo -i
set -a
. /root/.config/homelab/restic-offsite.env
set +a

restore_dir="/tmp/homelab-restic-restore-test"
install -d -m 700 "$restore_dir"

restic restore latest \
  --target "$restore_dir" \
  --include "/srv/homelab-backups/k3s/**"

find "$restore_dir" -type f -name "*.tar.gz" -print
tar -tzf "$(find "$restore_dir" -type f -name "*.tar.gz" | sort | tail -1)" | head

exit
```

Record the restore date, duration, result, and any fixes in the backup notes.
Do not keep restored sensitive data longer than needed for the test.

## Phase 5: configure Longhorn backups

Longhorn also supports S3-compatible backup targets. Configure this only after
the object storage bucket and credentials have been created.

Required Kubernetes secret values are provider-specific, but generally include:

- `AWS_ACCESS_KEY_ID`;
- `AWS_SECRET_ACCESS_KEY`;
- `AWS_ENDPOINTS`.

Create those values as a SealedSecret, then configure the Longhorn backup target
through GitOps or the Longhorn UI using the provider's S3-compatible target
format.

Use placeholders only in Git:

```text
s3://<bucket-name>@<region>/<longhorn-prefix>
```

Validation:

1. Create one manual Longhorn backup for a low-risk test volume.
2. Confirm the backup reaches the object storage bucket.
3. Restore it to a new test PVC.
4. Mount the restored PVC and verify the expected test data.

Do not delete Longhorn backup objects directly from the bucket unless the
Longhorn documentation says it is safe. Prefer Longhorn-managed retention and
cleanup.

## Completion criteria

The off-site backup target is complete when:

- restic can back up and restore the k3s archive directory from object storage;
- restic retention is automated and documented;
- Longhorn can back up and restore at least one test volume;
- all backup credentials are either stored outside Git or represented as
  SealedSecrets;
- monitoring or a manual recurring check exists for stale backups.
