# Uptime Kuma

Uptime/status monitoring, pushing alerts to your phone via the `ntfy`
deployment in this repo (`kubernetes/applications/ntfy`).

## Access

- URL: `https://status.apps.lab.sirnotethan.uk`
- Namespace: `uptime-kuma`
- Service: `uptime-kuma`

## First run

Open the URL and create the initial admin account (first visitor to set a
password wins - do this immediately after the first sync, before anything
else can reach it).

## Wire up phone push (ntfy)

Uptime Kuma notifications are configured in the UI, not via manifest - do
this once ntfy is deployed and you've added its topic to your phone (see
`kubernetes/applications/ntfy/README.md`):

1. Settings -> Notifications -> Add new notification.
2. Type: `ntfy`.
3. Server URL: `https://ntfy.apps.lab.sirnotethan.uk`.
4. Topic: the same topic you subscribed to in the ntfy phone app.
5. Priority: `Default` (or `High` for things you want to wake up for).
6. Save, then apply it as the default notification so every new monitor
   uses it automatically.
7. Test with the "Test" button before relying on it.

## Add your first monitors

Once notifications work, add monitors for the other apps in this batch -
Jellyfin, Vaultwarden, Forgejo, etc. - plus anything else in the cluster you
want to know about if it goes down.

## Storage

`uptime-kuma-data` (`longhorn-2replica`, `3Gi`) - SQLite database (monitors,
history, notification config).

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get pods,svc,ingress,pvc -n uptime-kuma -o wide
kubectl logs -n uptime-kuma deploy/uptime-kuma --tail=80
```
