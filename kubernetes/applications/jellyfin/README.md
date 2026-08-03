# Jellyfin

Jellyfin is the homelab media server.

## Access

- URL: `https://jellyfin.apps.lab.sirnotethan.uk`
- Namespace: `jellyfin`
- Service: `jellyfin`

First run: open the URL and complete the setup wizard (admin account,
library scan of `/media`).

## Storage

- `jellyfin-config` (`longhorn-2replica`, `5Gi`) - server config, users,
  metadata, watched state.
- `jellyfin-media` (`longhorn-2replica`, `500Gi` starting size, read-only
  mount) - your actual library.
- Transcode cache is an `emptyDir` (`10Gi`) - ephemeral on purpose, don't
  store anything you care about there.

`jellyfin-media` is a placeholder size. Resize the PVC once you know your
real library size, or repoint the `jellyfin-media` volume at an existing
NFS/SMB share if you already have one instead of copying everything into a
new Longhorn volume.

## Populating the library

Copy or sync media into the `jellyfin-media` PVC, then in Jellyfin add a
library pointing at `/media`.

## Hardware transcoding

Not configured yet. This deployment does software transcoding only. If you
want hardware transcoding later, add a `nodeSelector` pinning this to a node
with a GPU/iGPU, mount `/dev/dri`, and set the appropriate Jellyfin hardware
acceleration option in the admin dashboard.

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get pods,svc,ingress,pvc -n jellyfin -o wide
kubectl logs -n jellyfin deploy/jellyfin --tail=80
```
