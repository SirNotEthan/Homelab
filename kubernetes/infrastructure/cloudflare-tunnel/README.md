# Cloudflare Tunnel

Runs the remotely-managed Homelab Cloudflare Tunnel connector inside k3s.

The tunnel token is stored as a SealedSecret and mounted into the `cloudflared`
deployment at runtime.

## Public hostnames

Configure public hostnames in Cloudflare Zero Trust, not in this repo:

- `studentlens.sirnotethan.uk` -> `http://traefik.ingress-system.svc.cluster.local`

Cloudflare provides public HTTPS at the edge. The tunnel can speak plain HTTP to
Traefik inside the cluster.

## Verify

```bash
kubectl get pods -n cloudflare-tunnel
kubectl logs -n cloudflare-tunnel deploy/cloudflared --tail=80
```
