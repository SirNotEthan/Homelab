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

## Restore outline

This outline is not yet a tested restore procedure.

1. Rebuild or replace the control-plane host using the host baseline.
2. Stop k3s if it is running.
3. Restore the archived `server/db`, `server/token`, and
   `/etc/rancher/k3s/config.yaml` paths with root ownership and restrictive
   permissions.
4. Start k3s.
5. Confirm Kubernetes API access.
6. Confirm Argo CD, ingress, certificates, and storage health.
7. Reconcile remaining desired state from Git.

## Follow-up

- Add a tested restore exercise.
- Add off-site encrypted backup storage.
