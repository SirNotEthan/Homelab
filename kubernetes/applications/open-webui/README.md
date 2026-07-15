# Open WebUI

Open WebUI is the private browser interface for the homelab AI platform.

## Access

- URL: `https://ai.apps.lab.sirnotethan.uk`
- Namespace: `ai`
- Service: `open-webui`

The UI connects to the internal Ollama service:

```text
http://ollama.ai.svc.cluster.local:11434
```

Web search is configured to use the internal SearXNG service:

```text
http://searxng.ai.svc.cluster.local/search?q=<query>&format=json
```

Open WebUI stores some settings after first launch. If web search does not
appear after a rollout, enable it in the admin settings and use the SearXNG URL
above.

## First login

On the first visit, create the initial local administrator account. Store the
credentials in the private break-glass notes location.

Authentik SSO is planned through OpenID Connect. Keep the local admin login
available until SSO is configured, tested, and recorded as a break-glass path.

Runbook:

```text
docs/runbooks/open-webui-authentik.md
```

## Storage

Open WebUI stores user accounts, settings, and chat data in the
`open-webui-data` PVC using the `longhorn-2replica` storage class.

Initial size: `10Gi`.

## Validation

```bash
kubectl get pods,svc,pvc,ingress -n ai -o wide
kubectl logs -n ai deploy/open-webui --tail=80
```

From a Windows client:

```powershell
Resolve-DnsName ai.apps.lab.sirnotethan.uk
Invoke-WebRequest https://ai.apps.lab.sirnotethan.uk -UseBasicParsing
```
