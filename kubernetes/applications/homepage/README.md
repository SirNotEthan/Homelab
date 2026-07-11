# Homepage

Homepage is the first user-facing platform dashboard deployed on the cluster.

## Exposure

Homepage is exposed through the private application DNS namespace behind
Traefik. TLS uses the existing wildcard application certificate Secret in the
`homepage` namespace.

The TLS Secret is intentionally not stored in Git. It is created as part of the
certificate-management bootstrap until secret management is implemented.

## Configuration

The dashboard configuration is stored in `homepage-config` and mounted into the
container as individual files. The logs directory is mounted as writable
ephemeral storage because the Homepage image writes runtime logs under the
configuration path.

## Validation

```bash
kubectl get pods,svc,ingress,configmap -n homepage -o wide
kubectl get application homepage -n argocd
```

From a Windows client:

```powershell
Resolve-DnsName homepage.apps.lab.sirnotethan.uk
Invoke-WebRequest https://homepage.apps.lab.sirnotethan.uk/api/services -UseBasicParsing
```

