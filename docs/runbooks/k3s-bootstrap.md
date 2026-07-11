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
- Tailscale split DNS was configured for `lab.sirnotethan.uk`, allowing the
  Windows administrative workstation to resolve the application namespace
  without an explicit DNS server.

The resolver currently returns duplicate identical answers for the base
application name and wildcard child names. This is harmless but should be
simplified when the DNS role is next refactored.

## Traefik ingress installation

Traefik was installed with Helm into the `ingress-system` namespace rather than
using the packaged k3s Traefik deployment. The Helm values are private for now
because they include the reserved ingress address.

Validation evidence:

- Two Traefik replicas reported `Running`.
- The Traefik service used `LoadBalancer` type and received the reserved
  private MetalLB ingress address.
- The `traefik` ingress class was created as the default ingress class.
- Windows successfully opened TCP ports 80 and 443 on
  `apps.lab.sirnotethan.uk`.

## HTTP ingress smoke test

A temporary `whoami` deployment, service, and standard Kubernetes Ingress were
created in the `smoke-test` namespace.

Validation evidence:

- `whoami.apps.lab.sirnotethan.uk` resolved through split DNS to the private
  MetalLB ingress address.
- A Windows client received HTTP 200 from the whoami application through
  Traefik.
- Browser access to the same host displayed the request headers forwarded by
  Traefik.

## cert-manager and HTTPS validation

cert-manager was installed with Helm into the `cert-manager` namespace. The
Cloudflare API token was stored only as a Kubernetes Secret and was not written
to Git.

Validation evidence:

- cert-manager, cainjector, and webhook pods reported `Running`.
- A Let's Encrypt staging wildcard certificate for the application namespace
  issued successfully.
- A Let's Encrypt production wildcard certificate for the application namespace
  issued successfully.
- The production TLS Secret was copied into the `smoke-test` namespace for the
  temporary whoami Ingress test.
- A Windows client received HTTP 200 from
  `https://whoami.apps.lab.sirnotethan.uk` with a trusted certificate.

## Longhorn storage installation

Longhorn was installed with Helm into the `longhorn-system` namespace after the
cluster, ingress, DNS, and certificate path were working. Host prerequisites
were applied to all Kubernetes nodes before installation, including iSCSI, NFS,
device-mapper, and crypto tooling.

The cluster uses a dedicated default storage class named `longhorn-2replica` for
new application volumes. The older Longhorn-created `longhorn` storage class and
k3s `local-path` storage class are not default classes.

Validation evidence:

- Longhorn pods reported `Running`.
- All Kubernetes nodes reported ready and schedulable in Longhorn.
- `longhorn-2replica` was the only default storage class.
- A smoke-test PVC using `longhorn-2replica` bound successfully.
- A smoke-test pod mounted the PVC and wrote data successfully.
- The test volume reported `healthy` with two running replicas.

## Homepage deployment

Homepage was deployed as the first user-facing platform service. The service is
served through the private application DNS namespace, Traefik, and the
production wildcard certificate.

Validation evidence:

- the Homepage pod reported `Running`;
- DNS resolved the Homepage application host through the private resolver path;
- HTTPS returned HTTP 200 through Traefik;
- the Homepage services API returned the managed Homelab configuration;
- browser access displayed the Infrastructure group with Traefik and Longhorn
  entries.

## Argo CD GitOps bootstrap

Argo CD was installed from the official upstream installation manifest into the
`argocd` namespace. The private application DNS namespace, Traefik, and the
production wildcard certificate expose the Argo CD UI.

The initial administrator password was changed after first login, and the
bootstrap `argocd-initial-admin-secret` was deleted.

The first GitOps-managed application is `argocd-access`, which reconciles the
homelab-specific Argo CD access configuration from this repository.

Validation evidence:

- Argo CD pods reported `Running`;
- HTTPS returned HTTP 200 through Traefik;
- the `argocd-access` Application reported `Synced` and `Healthy`.

## Follow-up

- Automate the k3s installation once the manual bootstrap is stable.
- Move the Traefik Helm values into declarative GitOps management without
  exposing private address data.
- Move cert-manager issuers and certificate requests into declarative GitOps
  management without exposing API tokens or private keys.
- Move Longhorn installation and storage smoke tests into declarative GitOps
  management.
- Move Homepage manifests into declarative GitOps management.
- Move the remaining platform components under Argo CD reconciliation.
- Document datastore backup and restore before treating the cluster as durable.
