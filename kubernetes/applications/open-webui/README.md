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

## First login

On the first visit, create the initial local administrator account. Store the
credentials in the private break-glass notes location.

Authentik SSO can be added later after the local deployment is stable.

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
