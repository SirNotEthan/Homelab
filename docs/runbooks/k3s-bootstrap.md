# k3s bootstrap runbook

## Purpose

Bootstrap the initial k3s cluster from the prepared Ubuntu hosts. This runbook
captures the manual bootstrap process used before GitOps is available.

## Prerequisites

- Host baseline and Tailscale automation completed on all cluster nodes.
- Static host addresses are configured from the private inventory.
- Private DNS and the future MetalLB ingress address are reserved.
- `kubectl` is installed on the administrative WSL controller.
- A k3s cluster token exists outside Git, for example
  `~/.homelab-k3s-token`.

No k3s token, kubeconfig, node token, or private address list belongs in this
public repository.

## Control-plane installation

The first server is `m910q-01`. k3s is installed from the upstream install
script, with persistent configuration stored in `/etc/rancher/k3s/config.yaml`.

The server configuration:

- sets a shared cluster token from the private controller token file;
- sets the node name and node IP from private inventory;
- adds the node name and address as TLS SANs;
- writes a readable administrative kubeconfig;
- disables packaged Traefik;
- disables packaged ServiceLB so MetalLB can provide the ingress address.

After installation, validate the server locally:

```bash
sudo systemctl status k3s --no-pager
sudo k3s kubectl get nodes -o wide
sudo k3s kubectl get pods -A
```

## Controller kubeconfig

Copy `/etc/rancher/k3s/k3s.yaml` from the control-plane node to
`~/.kube/homelab.yaml` on the WSL controller. Replace the loopback API server
address with the control-plane address from private inventory, then restrict
the file permissions:

```bash
chmod 600 ~/.kube/homelab.yaml
export KUBECONFIG="$HOME/.kube/homelab.yaml"
```

Persist the `KUBECONFIG` export in the controller shell profile if this is the
primary administrative cluster.

## Worker installation

Install each M700 node as a k3s agent using `/etc/rancher/k3s/config.yaml`.
Each worker configuration:

- points `server` at the control-plane API endpoint;
- uses the shared cluster token from the private controller token file;
- sets the node name and node IP from private inventory.

After each agent joins, verify from the controller:

```bash
kubectl get nodes -o wide
kubectl get pods -A
```

## Initial validation evidence

The initial cluster bootstrap completed with one control-plane node and three
workers:

- `m910q-01` joined as the control-plane node.
- `m700-01`, `m700-02`, and `m700-03` joined as workers.
- All nodes reported `Ready`.
- CoreDNS, local-path-provisioner, and metrics-server reported `Running`.
- Traefik and ServiceLB were intentionally disabled for later managed ingress
  and MetalLB installation.

## MetalLB installation

MetalLB was installed in native mode after the cluster nodes were ready. The
address pool and advertisement were applied from private manifests because the
exact service range is private inventory data.

Validation evidence:

- The MetalLB controller and one speaker per Kubernetes node reported
  `Running`.
- The configured address pool matched the private service block.
- A temporary nginx `LoadBalancer` service received the reserved private
  ingress address.
- A Windows client successfully opened TCP port 80 on that address.
- Split DNS resolved both `apps.lab.sirnotethan.uk` and a wildcard child name
  to the same reserved ingress address when queried through the private
  resolver.

Windows name resolution without an explicit DNS server still uses the client
default resolver. Client-wide or split DNS configuration is a separate step;
until then, use the private resolver explicitly when testing names.

## Follow-up

- Automate the k3s installation once the manual bootstrap is stable.
- Install the chosen ingress controller and cert-manager.
- Document datastore backup and restore before treating the cluster as durable.
