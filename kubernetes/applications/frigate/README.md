# Frigate

Frigate is the NVR / camera AI detection service, currently configured for
one TP-Link Tapo camera.

## Access

- URL: `https://frigate.apps.lab.sirnotethan.uk`
- Namespace: `frigate`
- Service: `frigate`

## Required setup before first sync

1. On the Tapo camera, enable RTSP (Tapo app -> camera -> Advanced Settings
   -> Camera Account) and set an RTSP-only username/password (not your
   TP-Link cloud account).
2. Edit `configmap.yaml` and replace:
   - `CHANGE_ME_USER` / `CHANGE_ME_PASS` - the RTSP account you just created.
   - `CHANGE_ME_CAMERA_IP` - the camera's LAN IP (set a DHCP reservation for
     it so this doesn't drift).
3. Commit before syncing the Argo CD application.

## Hardware acceleration

No GPU/Coral TPU configured yet - detection runs on CPU (`detectors.cpu1`),
which is fine for one camera at 5 FPS but will not scale. When you add a
Coral or a GPU:

- Coral USB: add a `hostPath` device mount for `/dev/bus/usb` and switch the
  detector type to `edgetpu`.
- Intel iGPU (VAAPI): mount `/dev/dri` and set `hwaccel_args` under
  `ffmpeg` to the VAAPI preset.

Pin the deployment to whichever node actually has the hardware with a
`nodeSelector` once you do this - CPU-only mode can run anywhere.

## Storage

- `frigate-media` (`longhorn-2replica`, `50Gi`) - recordings (7-day
  motion-only retention) and snapshots (14-day retention). Grow this if you
  add cameras.
- `/dev/shm` is a memory-backed `emptyDir` (`256Mi`) for frame buffers -
  there's no k8s equivalent of Docker's `--shm-size`, this is the standard
  workaround. Raise `sizeLimit` if Frigate logs shared-memory errors.

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get pods,svc,ingress,pvc -n frigate -o wide
kubectl logs -n frigate deploy/frigate --tail=100
```

Confirm the camera connected: open the UI, the `tapo_cam_1` tile should show
a live thumbnail. If it doesn't, check the RTSP credentials/IP first - that's
the most common failure.
