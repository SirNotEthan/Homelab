import type { ArgoApp, ArgoPayload } from "../lib/api-types";

const APP_NAMES = [
  "homepage",
  "monitoring-stack",
  "sealed-secrets",
  "cert-manager",
  "ingress-nginx",
  "longhorn",
  "authentik",
  "ollama",
  "open-webui",
  "searxng",
  "homelab-infra"
];

const APPS: ArgoApp[] = APP_NAMES.map((name, index) => ({
  name,
  syncStatus: "Synced",
  healthStatus: "Healthy",
  revision: index === 0 ? "8f3a1c2" : `a${(index * 7331).toString(16).slice(0, 6)}`,
  lastSyncAt: index === 0 ? "4m ago" : `${(index + 1) * 12}m ago`,
  url: `https://argocd.home.arpa/applications/${name}`
}));

export const ARGOCD_STATUS: ArgoPayload = {
  apps: APPS,
  summary: {
    synced: APPS.filter((app) => app.syncStatus === "Synced").length,
    degraded: APPS.filter((app) => app.healthStatus === "Degraded").length,
    outOfSync: APPS.filter((app) => app.syncStatus === "OutOfSync").length,
    lastDeployment: { app: "homepage", when: "4m ago" }
  }
};
