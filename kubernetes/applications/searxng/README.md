# SearXNG

SearXNG provides private metasearch for human research and future local AI
search-augmentation workflows.

## Access

- URL: `https://search.apps.lab.sirnotethan.uk`
- Namespace: `ai`
- Service: `searxng`

The service is exposed only through the private application DNS namespace and
the existing Traefik HTTPS ingress.

## Required Secret

Create the runtime Secret before syncing the Argo CD application:

```bash
export KUBECONFIG="$HOME/.kube/homelab.yaml"

kubectl create namespace ai --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic searxng-secrets \
  -n ai \
  --from-literal=SEARXNG_SECRET="$(openssl rand -hex 32)" \
  --dry-run=client -o yaml | kubectl apply -f -
```

This Secret should be migrated to Sealed Secrets after the first successful
deployment.

## Validation

```bash
kubectl get pods,svc,ingress -n ai -o wide
kubectl logs -n ai deploy/searxng --tail=80
```

From a Windows client:

```powershell
Resolve-DnsName search.apps.lab.sirnotethan.uk
Invoke-WebRequest https://search.apps.lab.sirnotethan.uk -UseBasicParsing
```
