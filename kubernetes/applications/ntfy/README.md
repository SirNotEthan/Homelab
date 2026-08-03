# ntfy

Self-hosted push notification server. Deployed so Uptime Kuma (and anything
else later) can push alerts straight to your phone with no third-party
account.

## Access

- URL: `https://ntfy.apps.lab.sirnotethan.uk`
- Namespace: `ntfy`
- Service: `ntfy`

## Phone setup

1. Install the ntfy app (Android: Play Store / F-Droid, iOS: App Store).
2. In the app, add server `https://ntfy.apps.lab.sirnotethan.uk`.
3. Subscribe to a topic - topics are just names, created on first use. Pick
   something long and hard to guess for anything you care about, e.g.
   `homelab-alerts-<random string>`, since this server allows anyone who
   knows a topic name to publish or subscribe to it (`auth-default-access:
   read-write` in `configmap.yaml`).

Use the same topic name when wiring up Uptime Kuma's ntfy notification
(server URL: `https://ntfy.apps.lab.sirnotethan.uk`, no access token needed
with the default config).

## Locking it down later

If you want authenticated topics instead of the open-by-default model, see
the ntfy docs on `ntfy user add` / `ntfy access` - `auth-file` is already
configured and persisted on the `ntfy-cache` PVC, so you can switch
`auth-default-access` to `deny-all` and grant specific users/topics without
losing existing subscriptions.

## Storage

`ntfy-cache` (`longhorn-2replica`, `2Gi`) - message cache, attachment cache,
and the auth database if you enable auth.

## Validation

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl get pods,svc,ingress,pvc -n ntfy -o wide
kubectl logs -n ntfy deploy/ntfy --tail=80

# send a test push (subscribe to "test" in the phone app first)
curl -d "Hello from ntfy" https://ntfy.apps.lab.sirnotethan.uk/test
```
