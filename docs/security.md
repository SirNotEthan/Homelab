# Security

## Security objectives

- Keep administrative surfaces private.
- Minimise the effect of a compromised account, service, or node.
- Keep credentials out of Git while preserving reproducible configuration.
- Make patching, access review, and recovery routine.

## Baseline controls

- SSH keys only; disable password-based remote login after access is verified.
- Tailscale for remote administration with MFA on the identity provider.
- Least-privilege service accounts and namespace-scoped permissions.
- HTTPS for browser-facing services.
- Automatic operating-system security updates with planned reboot handling.
- No secrets, tokens, private keys, `.env` files, or kubeconfigs in Git.
- Default-deny network policies where supported and tested.
- Images pinned to reviewed versions rather than mutable `latest` tags.

## Identity and access

Authentik is the target SSO provider for compatible applications. SSO does not
remove the need for application-level authorization or emergency local access.
Break-glass credentials must be unique, stored in a password manager, and tested
periodically.

Human and automation identities should be separate. Long-lived automation
tokens are rotated and granted only the scope required for their workload.

## Secrets management

The secrets implementation is an open architecture decision. Until one is
adopted, manifests committed to Git must contain only references or documented
placeholders. Secrets may be provided manually for experiments, but that is not
considered a finished deployment.

If a secret is committed accidentally:

1. Revoke or rotate it immediately.
2. Assess where it was used and review relevant logs.
3. Remove it from current files and, where appropriate, Git history.
4. Document the incident without reproducing the secret.

## Maintenance

- Review accounts, Tailscale devices, and deploy keys quarterly.
- Apply critical patches promptly and record disruptive upgrades.
- Scan dependencies and container images when automation is introduced.
- Restore backups during recovery tests; encrypted but untested data is not a
  verified backup.

## Not stored here

Passwords, recovery codes, private keys, Tailscale auth keys, API tokens,
kubeconfigs, and private inventory details do not belong in this repository.
