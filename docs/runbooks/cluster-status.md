# Cluster status runbook

## Purpose

Capture the current health of the homelab Kubernetes platform before making a
larger change. Use this runbook after bootstrap, before storage changes, before
upgrades, and after incidents.

## Controller setup

Run from the WSL administrative controller:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"
```

The kubeconfig is private controller state and must not be committed.

## Core cluster checks

```bash
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl get events -A --sort-by=.lastTimestamp
```

Expected baseline:

- one control-plane node is `Ready`;
- three worker nodes are `Ready`;
- CoreDNS, local-path-provisioner, and metrics-server are running;
- no new warning events indicate an active platform failure.

## Networking checks

```bash
kubectl get pods -n metallb-system -o wide
kubectl get ipaddresspools -n metallb-system
kubectl get l2advertisements -n metallb-system
kubectl get svc -n ingress-system -o wide
kubectl get ingressclass
```

Expected baseline:

- MetalLB controller and all speakers are running;
- the private address pool exists;
- Traefik has a `LoadBalancer` service with the reserved ingress address;
- the `traefik` ingress class exists and is the default class.

## Certificate checks

```bash
kubectl get pods -n cert-manager -o wide
kubectl get clusterissuer
kubectl get certificate -A
kubectl get orders -A
kubectl get challenges -A
```

Expected baseline:

- cert-manager, cainjector, and webhook are running;
- staging and production Cloudflare issuers exist;
- the production wildcard application certificate is `Ready`;
- no challenges remain pending after issuance.

## Storage checks

```bash
kubectl get pods -n longhorn-system -o wide
kubectl get nodes.longhorn.io -n longhorn-system
kubectl get storageclass
kubectl get volumes.longhorn.io -n longhorn-system
kubectl get replicas.longhorn.io -n longhorn-system
```

Expected baseline:

- Longhorn manager, CSI, engine image, instance manager, and UI pods are
  running;
- all Kubernetes cluster nodes are ready and schedulable in Longhorn;
- `longhorn-2replica` is the only default storage class;
- production volumes report healthy robustness;
- application volumes use two replicas unless a workload explicitly requests a
  different storage class.

## Smoke-test checks

The temporary whoami application verifies ingress and TLS until a real platform
service replaces it.

```bash
kubectl get pods,svc,ingress -n smoke-test -o wide
kubectl get pvc,pod -n storage-smoke-test -o wide
```

From a Windows client:

```powershell
Resolve-DnsName whoami.apps.lab.sirnotethan.uk
Invoke-WebRequest https://whoami.apps.lab.sirnotethan.uk -UseBasicParsing
```

Expected baseline:

- split DNS resolves the whoami host to the private ingress address;
- HTTPS returns `200 OK` with a trusted certificate;
- the response body contains the whoami request headers.
- the Longhorn storage smoke-test PVC is bound and the writer pod is running.

## Platform service checks

```bash
kubectl get pods,svc,ingress,configmap -n homepage -o wide
```

From a Windows client:

```powershell
Resolve-DnsName homepage.apps.lab.sirnotethan.uk
Invoke-WebRequest https://homepage.apps.lab.sirnotethan.uk/api/services -UseBasicParsing
```

Expected baseline:

- the Homepage pod is running;
- the Homepage Ingress is served through Traefik and the application wildcard
  certificate;
- the services API returns the Homelab configuration, including Traefik and
  Longhorn entries.

## Host checks

```bash
cd /mnt/c/Users/ethnb/Documents/Homelab/ansible
export ANSIBLE_CONFIG="$PWD/ansible.cfg"

ansible m910q-01,m700-01,m700-02,m700-03 \
  -m ansible.builtin.shell \
  -a 'hostname; systemctl is-active ssh chrony tailscaled k3s k3s-agent 2>/dev/null || true; df -h /'
```

Expected baseline:

- SSH, chrony, and tailscaled are active on every host;
- k3s is active on the control-plane node;
- k3s-agent is active on worker nodes;
- root filesystems have comfortable free space.

## Current known limitations

- The control plane is not highly available.
- k3s datastore backup and restore are not yet implemented.
- The smoke-test workload and Helm values are still manually applied.
- Secrets are manually created in the cluster and are not yet managed by a
  declarative secret-management workflow.
- Longhorn backup targets and volume restore exercises are not yet implemented.
