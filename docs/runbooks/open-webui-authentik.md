# Open WebUI Authentik SSO

This runbook records the intended Open WebUI integration with Authentik using
OpenID Connect.

Open WebUI currently keeps local login enabled. Do not disable password login
until Authentik login has been tested and the local admin break-glass path is
confirmed.

## Target state

- Open WebUI remains available at `https://ai.apps.lab.sirnotethan.uk`.
- Authentik is the preferred login path.
- The local Open WebUI admin account remains available for break-glass recovery.
- OAuth client credentials are stored as a Kubernetes Secret managed through
  Sealed Secrets.

## Authentik provider

Create an Authentik OAuth2/OpenID provider for Open WebUI:

| Field | Value |
|---|---|
| Name | `Open WebUI` |
| Suggested slug | `open-webui` |
| Client type | Confidential |
| Flow | Authorization code |
| Redirect URI | `https://ai.apps.lab.sirnotethan.uk/oauth/oidc/callback` |
| Scopes | `openid`, `profile`, `email` |
| Subject mode | Hashed user ID or default provider subject |

After creating the provider, create or attach an Authentik application for:

```text
https://ai.apps.lab.sirnotethan.uk
```

Record the generated client ID and client secret in a local private note until
they are sealed.

## Open WebUI configuration

Open WebUI should be configured with these settings:

| Environment variable | Value |
|---|---|
| `WEBUI_URL` | `https://ai.apps.lab.sirnotethan.uk` |
| `ENABLE_OAUTH_SIGNUP` | `true` |
| `OAUTH_PROVIDER_NAME` | `Authentik` |
| `OPENID_PROVIDER_URL` | `https://auth.apps.lab.sirnotethan.uk/application/o/open-webui/.well-known/openid-configuration` |
| `OAUTH_SCOPES` | `openid email profile` |
| `OAUTH_CLIENT_ID` | From Authentik provider |
| `OAUTH_CLIENT_SECRET` | From Authentik provider |
| `ENABLE_LOGIN_FORM` | Keep `true` until SSO and break-glass access are tested |
| `ENABLE_PASSWORD_AUTH` | Keep `true` until SSO and break-glass access are tested |

Open WebUI persists many settings in its database after first launch. OAuth
settings can also be persistent. If environment values appear ignored, update
the settings in the Open WebUI admin panel or set
`ENABLE_OAUTH_PERSISTENT_CONFIG=false` deliberately when moving to GitOps-owned
OAuth configuration.

## Sealed Secret plan

Create a Kubernetes Secret named `open-webui-oidc` in the `ai` namespace:

```bash
kubectl create secret generic open-webui-oidc \
  -n ai \
  --from-literal=OAUTH_CLIENT_ID="<client-id>" \
  --from-literal=OAUTH_CLIENT_SECRET="<client-secret>" \
  --dry-run=client -o yaml
```

Seal it with the cluster Sealed Secrets controller and commit only the
SealedSecret:

```bash
kubeseal \
  --controller-name sealed-secrets \
  --controller-namespace sealed-secrets \
  --format yaml \
  < /tmp/open-webui-oidc.secret.yaml \
  > kubernetes/applications/open-webui/secrets/open-webui-oidc.sealedsecret.yaml
```

Do not commit the unsealed Secret.

## Deployment change

After the SealedSecret exists, update the Open WebUI deployment to read:

```yaml
- name: OAUTH_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: open-webui-oidc
      key: OAUTH_CLIENT_ID
- name: OAUTH_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: open-webui-oidc
      key: OAUTH_CLIENT_SECRET
```

Add the non-secret OAuth environment variables directly to the deployment.

## Validation

1. Reconcile the Open WebUI application in Argo CD.
2. Confirm the Open WebUI pod rolls out successfully.
3. Open `https://ai.apps.lab.sirnotethan.uk`.
4. Confirm the Authentik sign-in option is visible.
5. Sign in through Authentik.
6. Confirm the existing local admin login still works.
7. Record the test in the break-glass runbook before disabling any local login
   path.

## Rollback

If SSO fails:

1. Revert the Open WebUI deployment OAuth environment variables.
2. Reconcile Open WebUI in Argo CD.
3. Log in using the local Open WebUI admin account.
4. Confirm `WEBUI_URL` remains set to `https://ai.apps.lab.sirnotethan.uk`.
