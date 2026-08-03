# AdGuard Home

Network-wide DNS ad/tracker blocking.

## Required setup before first sync

There's no MetalLB in this cluster, so there's no LoadBalancer IP for port
53 to bind to. This deployment uses `hostNetwork: true` instead - the pod
binds directly to a node's real IP, and you point your router/devices at
that node.

Before syncing, pick a cluster node to run this on and label it:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get nodes
kubectl label node <node-name> homelab.sirnotethan.uk/role=dns
```

`<node-name>` is one of the cluster nodes (see `ansible/inventory/hosts.yml`
for the known hosts: `m700-01`, `m700-02`, `m700-03`, `m910q-01`). Once
labelled, this Deployment's `nodeSelector` will schedule AdGuard there.

## This does not touch the existing dnsmasq role

Your `ansible/roles/dnsmasq` setup is untouched and still active. AdGuard
runs alongside it. Nothing on your network points at AdGuard until you
manually update DHCP/router DNS settings to the node's IP - do that only
once you've completed AdGuard's setup wizard and are happy with it.

## Access

- Setup wizard: `http://<node-ip>:3000` - **only exists during first boot**,
  before you complete the install wizard.
- Ongoing web UI (after setup completes): `http://<node-ip>` (port 80) or
  `https://adguard.apps.lab.sirnotethan.uk` (routed through Traefik to the
  same port). AdGuard stops listening on 3000 once installed - don't expect
  it to keep working after first run.
- DNS: `<node-ip>:53` (UDP + TCP).
- Namespace: `adguard`

## First run

1. Open `http://<node-ip>:3000` and complete the setup wizard (admin
   account, listen interfaces - use the defaults, `hostNetwork` already
   exposes all node interfaces).
2. Set upstream DNS resolvers (e.g. `1.1.1.1`, `9.9.9.9`, or your ISP's).
3. Test resolution from a client manually:
   `dig @<node-ip> example.com` before changing anything network-wide.
4. Only after that works, update your router/DHCP DNS setting to
   `<node-ip>` to actually start using it.
5. From then on, manage AdGuard at `http://<node-ip>` (port 80) or the
   `adguard.apps.lab.sirnotethan.uk` ingress, not port 3000.

## Storage

- `adguard-conf` (`longhorn-2replica`, `1Gi`) - `AdGuardHome.yaml` config.
- `adguard-work` (`longhorn-2replica`, `5Gi`) - query log and stats DB.

## Validation

```bash
kubectl get pods,svc,ingress,pvc -n adguard -o wide
kubectl logs -n adguard deploy/adguard-home --tail=80
dig @<node-ip> example.com
```
