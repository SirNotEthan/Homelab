# Homelab Core

Homelab Core is the private admin dashboard and future Steward AI command
center for the homelab.

It replaces the stock Homepage dashboard while keeping the existing application
name, namespace, service, ingress, and private URL.

## Exposure

Homelab Core is exposed through the private application DNS namespace behind
Traefik. TLS uses the existing wildcard application certificate Secret in the
`homepage` namespace.

The TLS Secret is intentionally not stored in Git. It is created as part of the
certificate-management bootstrap until secret management is implemented.

## Configuration

Homelab Core is now served by the custom Next.js application in
`/homepage`. The production image is built from `homepage/Dockerfile` and
published to GitHub Container Registry as:

```text
ghcr.io/sirnotethan/homelab-core:main
```

The interface uses React and React Three Fiber for the Steward Core orbital
knowledge cluster. The visual direction is a cold cyan/teal private command
center: deep navy panels, cyan-gray borders, pale cyan-white core glow, and
teal operational accents.

Current screens:

- Overview
- AI Core
- Memory and Skills

## Validation

```bash
kubectl get pods,svc,ingress -n homepage -o wide
kubectl get application homepage -n argocd
```

From a Windows client:

```powershell
Resolve-DnsName homepage.apps.lab.sirnotethan.uk
Invoke-WebRequest https://homepage.apps.lab.sirnotethan.uk -UseBasicParsing
```
