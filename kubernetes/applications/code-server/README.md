# code-server

code-server provides a private VS Code-compatible development environment at
`https://code.apps.lab.sirnotethan.uk` for LAN and Tailscale clients.

## Design

- The service is intentionally absent from the Cloudflare Tunnel and public DNS.
- Traefik terminates HTTPS using the private application wildcard certificate.
- Native code-server password authentication remains enabled as a second layer.
- A 20 GiB node-local volume persists the complete `/home/coder` directory,
  including repositories, editor settings, extensions, and terminal history.
- The workload is placed on `m910q-01`, which has the most memory headroom.
- The container is unprivileged and has no host filesystem, Kubernetes API, or
  container-runtime socket mounted into it.
- A namespace ingress policy permits browser traffic only through Traefik.
- The custom image includes Node.js 22, npm, pnpm, Python, Git, SSH, curl, jq,
  ripgrep, build tools, kubectl, and Helm.
- Initial editor settings favor iPad use and persistently remain user-editable.

## Access

Connect the iPad to Tailscale and open:

```text
https://code.apps.lab.sirnotethan.uk
```

The initial password is stored only in the ignored local file
`.local/code-server-password.txt` on the administration workstation.

In Safari, use **Share > Add to Home Screen** to install code-server as a PWA.

The workspace supports browser-accessible forwarded ports under code-server's
authenticated `/proxy/<port>/` route. It does not expose development servers as
separate public services.

## Development image

GitHub Actions builds `images/code-server/Dockerfile` as:

```text
ghcr.io/sirnotethan/homelab-code-server:0.1.0
```

The GHCR package must allow anonymous pulls. On its first publication, confirm
the package visibility is **Public** under the GitHub package settings.

Verify the installed tools from the editor terminal:

```bash
node --version
npm --version
pnpm --version
python3 --version
jq --version
rg --version
kubectl version --client
helm version --short
```

## Validation

```bash
kubectl get application code-server -n argocd
kubectl get pods,svc,ingress,pvc,networkpolicy -n development -o wide
kubectl logs -n development deployment/code-server --tail=100
```

## Backup and recovery

The `code-server-home` PVC contains all persistent editor state and working
copies on `m910q-01`. It is deliberately not replicated. Git remains the source
of truth for committed work, so push or separately back up any uncommitted
material before deleting the PVC or rebuilding the node.

To recover, restore the PVC or allow Argo CD to create an empty replacement,
then clone the required repositories again. The SealedSecret recreates the
login Secret on the original cluster.

## Rollback

Revert the Git commit and let Argo CD prune the application. Preserve the PVC
until all uncommitted work has been recovered.
