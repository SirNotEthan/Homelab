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

The cert-manager Cloudflare token is restricted to DNS editing and zone reads
for `sirnotethan.uk`. The global Cloudflare API key must not be used. Public DNS
does not contain private service addresses, and certificate issuance does not
authorise public network exposure.

Certificate automation uses DNS-01 validation. ACME challenge records are
temporary public DNS records; application A and AAAA records remain private.

## Secrets management

GitOps-managed Kubernetes Secrets will use Sealed Secrets. See
[ADR-0008](decisions/0008-sealed-secrets.md) and the
[Sealed Secrets runbook](runbooks/sealed-secrets.md).

Until each existing manual Secret is migrated, manifests committed to Git must
contain only references or documented placeholders. Plain Kubernetes Secret
manifests, plaintext values, and generated recovery material must not be
committed.

The Sealed Secrets controller private key is recovery-critical. It must be
backed up outside Git and protected with the same care as other break-glass
material.

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
