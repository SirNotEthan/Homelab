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

The first implementation is a static HTML/CSS/JavaScript application stored in
the `homepage-config` ConfigMap and served by an unprivileged NGINX container.

This is intentionally simple for the first build slice. It proves the visual
direction and route replacement before introducing a full application build
pipeline.

Current screens:

- Overview
- AI Core
- Memory and Skills

The central Steward Core is currently implemented with HTML/CSS. A future
version should replace it with a real Three.js or React Three Fiber orbital
intelligence core.

## Validation

```bash
kubectl get pods,svc,ingress,configmap -n homepage -o wide
kubectl get application homepage -n argocd
```

From a Windows client:

```powershell
Resolve-DnsName homepage.apps.lab.sirnotethan.uk
Invoke-WebRequest https://homepage.apps.lab.sirnotethan.uk -UseBasicParsing
```
