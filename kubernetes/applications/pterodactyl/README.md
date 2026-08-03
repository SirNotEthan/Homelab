# Pterodactyl Panel

The Pterodactyl web panel (accounts, servers, permissions) - **not** Wings,
the daemon that actually runs game server containers. See "Wings" below,
that part is important.

## Access

- URL: `https://panel.apps.lab.sirnotethan.uk`
- Namespace: `pterodactyl`
- Components: `pterodactyl-panel` (this app), `pterodactyl-mariadb`,
  `pterodactyl-redis` (both internal, no ingress)

## Required secrets

Create these before syncing the Argo CD application:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl create namespace pterodactyl --dry-run=client -o yaml | kubectl apply -f -

# APP_KEY must be exactly this format: "base64:" + 32 random bytes, base64-encoded.
APP_KEY="base64:$(openssl rand -base64 32)"

kubectl create secret generic pterodactyl-secrets \
  -n pterodactyl \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=DB_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=APP_KEY="$APP_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Migrate this to Sealed Secrets after the first successful deployment (see
`docs/runbooks/sealed-secrets.md`) - it holds your database root password.

## First run: migrate the database and create your admin account

Wait for `pterodactyl-mariadb` and `pterodactyl-panel` to both be `Ready`,
then:

```bash
kubectl exec -n pterodactyl deploy/pterodactyl-panel -- php artisan migrate --seed --force

kubectl exec -it -n pterodactyl deploy/pterodactyl-panel -- php artisan p:user:make
```

Follow the prompts to create your admin account.

## Wings has to run outside this cluster

This is the important part. Wings (the agent that actually pulls images and
runs game server containers) needs direct access to a real Docker daemon on
a host it controls - that's a fundamentally different job than a
Kubernetes-scheduled pod, and doesn't run cleanly inside k8s (no supported
way to hand a pod a real, persistent Docker daemon the way Wings expects).

The standard setup is:

1. Pick a separate machine (VM or bare metal) with Docker installed - not a
   cluster node running other workloads, since Wings will be spinning up
   arbitrary game server containers on it.
2. Install Wings there following the official docs:
   `https://pterodactyl.io/wings/1.0/installing.html`.
3. In the Panel (`https://panel.apps.lab.sirnotethan.uk` -> Admin -> Nodes),
   create a Node pointing at that machine, generate its Wings config, and
   copy it onto the Wings host.
4. Start Wings there. Only then can you actually create game servers.

Until you do this, the Panel is fully usable for account/permission setup,
but "Create Server" has nowhere to run anything.

## Storage

- `pterodactyl-mariadb-data` (`longhorn-2replica`, `5Gi`) - database.
- `pterodactyl-panel-var` (`longhorn-2replica`, `2Gi`) - app cache/logs.
- `pterodactyl-panel-storage` (`longhorn-2replica`, `5Gi`) - uploaded
  assets (server icons, etc).
- Redis has no PVC (cache/session/queue only, fine to lose on restart).

## Validation

```bash
kubectl get pods,svc,ingress,pvc -n pterodactyl -o wide
kubectl logs -n pterodactyl deploy/pterodactyl-panel --tail=100
kubectl logs -n pterodactyl deploy/pterodactyl-mariadb --tail=50
```
