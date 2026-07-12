# Break-glass access

This runbook records emergency access paths for the homelab when normal SSO,
GitOps, DNS, or ingress paths are unavailable.

Break-glass access should be tested deliberately and kept minimal. Credentials,
private keys, recovery codes, and one-time passwords must not be committed to
Git.

## Current status

Break-glass access is not fully documented yet.

## Known emergency paths

| Layer | Access path | Notes |
|---|---|---|
| Workstation | Local Windows account | Used to reach WSL, SSH keys, Tailscale, and browser sessions |
| Network overlay | Tailscale admin session | Used to reach private hostnames and nodes remotely |
| Linux hosts | SSH key for the `ethan` user | Managed hosts deny password SSH after baseline application |
| Kubernetes | Local kubeconfig | Stored outside Git on the operator workstation |
| GitOps | Argo CD local admin account | Password must be stored outside Git |
| Identity | Authentik local admin account | Password must be stored outside Git |

## Minimum test plan

- Confirm SSH access to the k3s control-plane host without SSO.
- Confirm `kubectl get nodes` works from the operator workstation.
- Confirm Argo CD local admin login works.
- Confirm Authentik local admin login works.
- Confirm private DNS and Tailscale are not required for direct LAN recovery
  where possible.

## Follow-up

- Record where each emergency credential is stored.
- Add recovery steps for replacing a lost Authentik admin password.
- Add recovery steps for Argo CD local admin password rotation.
- Add an annual break-glass review cadence.
