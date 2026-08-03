# Cluster Watchdog

A `CronJob` that runs every 5 minutes and does three things:

1. **Argo CD apps that are `Degraded` or `OutOfSync`** - requests a hard
   refresh (`argocd.argoproj.io/refresh=hard` annotation) so Argo
   re-evaluates instead of sitting on a stale status, then sends an ntfy
   alert either way. A real manifest bug still needs a human; this just
   makes sure you find out fast instead of a status silently going stale
   for hours (see `jellyfin`'s missing PVC `requests:` block and the
   `ai`-namespace ownership conflict from 2026-08-03 - both sat undetected
   for a long time before anyone noticed).
2. **Pods stuck `CrashLoopBackOff` for 5+ restarts** in any namespace not in
   the exclude list (`kube-system`, `argocd`, `cert-manager`,
   `longhorn-system`, `monitoring`, `sealed-secrets`, `cluster-watchdog`) -
   deletes the pod so its Deployment/ReplicaSet recreates a clean one, and
   alerts. Restart count resets on the new pod, so this can't loop tightly -
   it only fires again after 5 more real crashes.
3. **PVCs stuck `Pending`** - almost always a manifest bug, not something
   auto-fixable. Alerts immediately rather than letting a pod block
   silently.

## What it deliberately does NOT do

No Secrets access, no write verbs on Deployments/Services/ConfigMaps, no
`kubectl apply`. It can only delete a Pod (to force a clean recreate) and
patch an Argo `Application`'s refresh annotation. If the actual fix requires
changing a manifest or filling in real credentials, this job can't and
won't do that - it alerts and gets out of the way.

## Setup

Create the ntfy topic secret (same topic you use everywhere else - see
`kubernetes/applications/ntfy/README.md`):

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl create namespace cluster-watchdog --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic cluster-watchdog-secrets \
  -n cluster-watchdog \
  --from-literal=NTFY_TOPIC="your-topic-here" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Without this secret, the CronJob still runs (the hard-refresh nudge and
pod-kick logic don't depend on it) - it just logs what it would have sent
instead of pushing to your phone.

## Validation

```bash
kubectl get cronjob,job -n cluster-watchdog
kubectl create job --from=cronjob/cluster-watchdog manual-test -n cluster-watchdog
kubectl logs -n cluster-watchdog -l job-name=manual-test --tail=100
```
