# Homelab Core

Homelab Core is the custom Steward command center that replaces the stock
Homepage dashboard at:

```text
https://homepage.apps.lab.sirnotethan.uk
```

This app is built with Next.js, React, Three.js, and React Three Fiber.

## Design direction

- Cold Territory Studio-style cyan/teal HUD palette.
- Deep navy and cyan-gray panels.
- Steward Core rendered as a 3D orbital intelligence system.
- Admin/operator interface first; household automation UI remains separate.

## Local development

```bash
npm install
npm run dev
```

## Production image

The image is built by GitHub Actions and published to GHCR:

```text
ghcr.io/sirnotethan/homelab-core:main
```

Kubernetes consumes that image through the `homepage` application manifests.
