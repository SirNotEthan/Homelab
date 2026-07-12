# Break-glass access

This runbook records emergency access paths for the homelab when normal SSO,
GitOps, DNS, or ingress paths are unavailable.

Break-glass access should be tested deliberately and kept minimal. Credentials,
private keys, recovery codes, and one-time passwords must not be committed to
Git.

## Current status

Break-glass access is partially documented and has a basic connectivity test.
Sensitive credential storage details are recorded outside Git.

## Known emergency paths

| Layer | Access path | Notes |
|---|---|---|
| Workstation | Local Windows account | Used to reach WSL, SSH keys, Tailscale, and browser sessions |
| Network overlay | Tailscale admin session | Used to reach private hostnames and nodes remotely |
| Linux hosts | SSH key for the `ethan` user | Managed hosts deny password SSH after baseline application |
| Kubernetes | Local kubeconfig | Stored outside Git on the operator workstation |
| GitOps | Argo CD local admin account | Password must be stored outside Git |
| Identity | Authentik local admin account | Password must be stored outside Git |

## Private notes

Sensitive storage locations and recovery notes are tracked locally in:

```text
.local/break-glass-private.md
```

The `.local/` directory is ignored by Git. Do not force-add it.

## Minimum test plan

- Confirm SSH access to the k3s control-plane host without SSO.
- Confirm `kubectl get nodes` works from the operator workstation.
- Confirm Argo CD local admin login works.
- Confirm Authentik local admin login works.
- Confirm private DNS and Tailscale are not required for direct LAN recovery
  where possible.

## Test record

### 2026-07-12

Passed:

- SSH to the k3s control-plane host succeeded and `k3s` was active.
- SSH to the utility host succeeded.
- `dnsmasq` and `tailscaled` were active on the utility host.
- Argo CD returned HTTP 200 over the private HTTPS application hostname.
- Authentik returned HTTP 200 over the private HTTPS application hostname.

Not yet tested:

- `kubectl get nodes` from the operator workstation as part of this runbook.
- Argo CD local admin login.
- Authentik local admin login.
- Credential recovery procedures.

## Follow-up

- Record where each emergency credential is stored.
- Add recovery steps for replacing a lost Authentik admin password.
- Add recovery steps for Argo CD local admin password rotation.
- Add an annual break-glass review cadence.
