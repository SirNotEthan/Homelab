# k3s datastore backup runbook

## Purpose

Create and verify a recovery point for the single-node k3s control plane.

The cluster currently uses the default SQLite datastore on the control-plane
node. It does not use embedded etcd or an external database.

## Sensitivity

k3s datastore backups are secret material. They include:

- the SQLite datastore;
- the k3s server token;
- the k3s server configuration.

The server token is required to restore confidential data from the datastore.
Backup archives must not be committed, pasted into chat, attached to issues, or
stored in world-readable locations.

## Current backup locations

| Location | Purpose | Access |
|---|---|---|
| Control-plane local backup directory | First local recovery point | root-only |
| `hp-utility-01` backup directory | Independent local copy | root-only |

The off-site backup target is not yet selected.

## Manual offline backup

Because the cluster uses SQLite, take an offline backup to avoid copying a
changing write-ahead log.

On the control-plane node:

```bash
backup_dir="/var/backups/homelab/k3s"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/k3s-sqlite-offline-${stamp}.tar.gz"

sudo install -d -m 700 -o root -g root "$backup_dir"
sudo systemctl stop k3s

sudo tar -czf "$backup_file" \
  -C / \
  var/lib/rancher/k3s/server/db \
  var/lib/rancher/k3s/server/token \
  etc/rancher/k3s/config.yaml

sudo chmod 600 "$backup_file"
sudo systemctl start k3s
sudo systemctl is-active k3s
sudo tar -tzf "$backup_file"
```

Validate from the administrative controller:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get nodes
kubectl get pods -A
kubectl get application -n argocd
```

## Copy to the backup host

Copy the archive to `hp-utility-01` and store it under the root-only k3s backup
directory. Use a temporary staging location only long enough to move the file
into its final restricted path, then remove temporary copies.

Verify the backup host copy:

```bash
sudo ls -lh /srv/homelab-backups/k3s/
sudo tar -tzf /srv/homelab-backups/k3s/<backup-file>.tar.gz
```

## Scheduled backup

A systemd timer on the control-plane node runs the offline SQLite backup daily.
The timer creates a local root-only archive, copies it to `hp-utility-01` using
a dedicated SSH key, stores the remote copy in the root-only backup directory,
and prunes local and remote k3s archives older than 14 days.

Systemd units:

```text
/etc/systemd/system/homelab-k3s-sqlite-backup.service
/etc/systemd/system/homelab-k3s-sqlite-backup.timer
```

Backup script:

```text
/usr/local/sbin/homelab-k3s-sqlite-backup
```

Schedule:

```text
Daily at 04:10 UTC, with up to 10 minutes randomized delay
```

Validation:

```bash
systemctl list-timers homelab-k3s-sqlite-backup.timer --no-pager
sudo systemctl status homelab-k3s-sqlite-backup.service --no-pager -l
sudo ls -lh /var/backups/homelab/k3s/
```

On `hp-utility-01`:

```bash
sudo ls -lh /srv/homelab-backups/k3s/
sudo tar -tzf /srv/homelab-backups/k3s/<backup-file>.tar.gz
```

## Restore procedure

This procedure is documented but not yet tested. Do not run it on the live
cluster unless performing a real control-plane restore.

### 1. Prepare the replacement control-plane host

Rebuild or replace the control-plane host using the documented host baseline.
Install the expected Ubuntu version, verify firmware and disk health, establish
SSH access, and do not join worker nodes until the control-plane datastore is
restored and validated.

### 2. Stage the backup archive

Copy the selected backup archive from the backup host to the replacement
control-plane host:

```bash
scp /path/to/k3s-sqlite-offline-<timestamp>.tar.gz \
  ethan@m910q-01:/tmp/k3s-restore.tar.gz
```

Then restrict it on the control-plane host:

```bash
sudo chown root:root /tmp/k3s-restore.tar.gz
sudo chmod 600 /tmp/k3s-restore.tar.gz
sudo tar -tzf /tmp/k3s-restore.tar.gz
```

The archive should contain:

```text
var/lib/rancher/k3s/server/db/
var/lib/rancher/k3s/server/db/state.db
var/lib/rancher/k3s/server/db/state.db-shm
var/lib/rancher/k3s/server/db/state.db-wal
var/lib/rancher/k3s/server/token
etc/rancher/k3s/config.yaml
```

### 3. Stop k3s and preserve any current state

```bash
sudo systemctl stop k3s || true

sudo install -d -m 700 -o root -g root /var/lib/rancher/k3s/server
sudo install -d -m 700 -o root -g root /etc/rancher/k3s

if [ -e /var/lib/rancher/k3s/server/db ]; then
  sudo mv /var/lib/rancher/k3s/server/db \
    "/var/lib/rancher/k3s/server/db.pre-restore.$(date -u +%Y%m%dT%H%M%SZ)"
fi

if [ -e /var/lib/rancher/k3s/server/token ]; then
  sudo cp -a /var/lib/rancher/k3s/server/token \
    "/var/lib/rancher/k3s/server/token.pre-restore.$(date -u +%Y%m%dT%H%M%SZ)"
fi

if [ -e /etc/rancher/k3s/config.yaml ]; then
  sudo cp -a /etc/rancher/k3s/config.yaml \
    "/etc/rancher/k3s/config.yaml.pre-restore.$(date -u +%Y%m%dT%H%M%SZ)"
fi
```

### 4. Restore the archived datastore, token, and configuration

```bash
sudo tar -xzf /tmp/k3s-restore.tar.gz -C /

sudo chown -R root:root /var/lib/rancher/k3s/server/db
sudo chown root:root /var/lib/rancher/k3s/server/token
sudo chown root:root /etc/rancher/k3s/config.yaml

sudo chmod 700 /var/lib/rancher/k3s/server/db
sudo chmod 600 /var/lib/rancher/k3s/server/token
sudo chmod 600 /etc/rancher/k3s/config.yaml
```

### 5. Start k3s and validate the control plane

```bash
sudo systemctl start k3s
sudo systemctl status k3s --no-pager -l
```

From the administrative controller:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get nodes
kubectl get pods -A
kubectl get application -n argocd
```

Expected:

- the control-plane node returns to `Ready`;
- worker nodes reconnect or are rejoined as needed;
- Argo CD Applications report `Synced` and `Healthy`;
- ingress, certificates, storage, and Homepage pass the cluster status runbook.

### 6. Post-restore actions

- Run the [cluster status runbook](cluster-status.md).
- Create a fresh k3s datastore backup after successful restore.
- Rotate credentials if the restore was triggered by compromise rather than
  hardware failure.
- Record the restore result and any runbook corrections.

## Follow-up

- Add a tested restore exercise.
- Add off-site encrypted backup storage.
