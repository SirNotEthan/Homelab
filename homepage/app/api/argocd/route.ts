import { NextResponse } from "next/server";
import type { ApiEnvelope, ArgoApp, ArgoPayload } from "../../lib/api-types";
import { ARGOCD_STATUS } from "../../data/argocdStatus";
import { ARGOCD_GROUP, ARGOCD_NAMESPACE, ARGOCD_VERSION, customApi } from "../../lib/k8s";

type ArgoApplicationResource = {
  metadata?: { name?: string };
  status?: {
    sync?: { status?: string; revision?: string };
    health?: { status?: string };
    reconciledAt?: string;
    operationState?: { finishedAt?: string };
  };
};

function timeAgoFromIso(iso?: string): string {
  if (!iso) return "unknown";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function buildLive(): Promise<ArgoPayload> {
  const custom = customApi();
  const result = (await custom.listNamespacedCustomObject({
    group: ARGOCD_GROUP,
    version: ARGOCD_VERSION,
    namespace: ARGOCD_NAMESPACE,
    plural: "applications"
  })) as { items?: ArgoApplicationResource[] };

  const withSyncMs = (result.items ?? []).map((item) => {
    const isoTime = item.status?.operationState?.finishedAt ?? item.status?.reconciledAt;
    const name = item.metadata?.name ?? "unknown";
    const syncStatus = (item.status?.sync?.status as ArgoApp["syncStatus"]) ?? "OutOfSync";
    const healthStatus = (item.status?.health?.status as ArgoApp["healthStatus"]) ?? "Missing";
    const app: ArgoApp = {
      name,
      syncStatus,
      healthStatus,
      revision: (item.status?.sync?.revision ?? "unknown").slice(0, 7),
      lastSyncAt: timeAgoFromIso(isoTime),
      url: `https://argocd.apps.lab.sirnotethan.uk/applications/${name}`
    };
    return { app, syncMs: isoTime ? new Date(isoTime).getTime() : 0 };
  });

  const apps = withSyncMs.map((w) => w.app);
  const mostRecent = [...withSyncMs].sort((a, b) => b.syncMs - a.syncMs)[0];

  return {
    apps,
    summary: {
      synced: apps.filter((a) => a.syncStatus === "Synced").length,
      degraded: apps.filter((a) => a.healthStatus === "Degraded").length,
      outOfSync: apps.filter((a) => a.syncStatus === "OutOfSync").length,
      lastDeployment: { app: mostRecent?.app.name ?? "unknown", when: mostRecent?.app.lastSyncAt ?? "unknown" }
    }
  };
}

export async function GET() {
  try {
    const data = await buildLive();
    const body: ApiEnvelope<ArgoPayload> = {
      data,
      meta: { source: "live", generatedAt: new Date().toISOString() }
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiEnvelope<ArgoPayload> = {
      data: ARGOCD_STATUS,
      meta: { source: "mock", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  }
}
