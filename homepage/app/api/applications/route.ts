import { NextResponse } from "next/server";
import type { ApiEnvelope, ApplicationItem, ApplicationStatus, ApplicationsPayload } from "../../lib/api-types";
import { APPLICATIONS } from "../../data/applications";
import { coreApi } from "../../lib/k8s";

const NAMESPACE_BY_ID: Record<string, string> = {
  jellyfin: "jellyfin",
  frigate: "frigate",
  vaultwarden: "vaultwarden",
  "adguard-home": "adguard",
  forgejo: "forgejo",
  "uptime-kuma": "uptime-kuma",
  "stirling-pdf": "stirling-pdf",
  pterodactyl: "pterodactyl"
};

async function buildLive(): Promise<ApplicationsPayload> {
  const core = coreApi();

  const apps: ApplicationItem[] = await Promise.all(
    APPLICATIONS.apps.map(async (app) => {
      const namespace = NAMESPACE_BY_ID[app.id];
      if (!namespace) return app;

      try {
        const pods = await core.listNamespacedPod({ namespace });
        const items = pods.items;
        if (items.length === 0) {
          return { ...app, status: "offline" as ApplicationStatus, detail: "No pods found" };
        }

        const notReady = items.filter((pod) => {
          const ready = (pod.status?.conditions ?? []).some((c) => c.type === "Ready" && c.status === "True");
          return pod.status?.phase !== "Running" || !ready;
        });

        if (notReady.length === 0) {
          return { ...app, status: "healthy" as ApplicationStatus, detail: "Running" };
        }

        const reasons = notReady
          .flatMap((pod) => (pod.status?.containerStatuses ?? []).map((cs) => cs.state?.waiting?.reason))
          .filter(Boolean);
        const detail = reasons[0] ? String(reasons[0]) : `${notReady.length}/${items.length} pods not ready`;
        return { ...app, status: "attention" as ApplicationStatus, detail };
      } catch {
        return app;
      }
    })
  );

  return { apps };
}

export async function GET() {
  try {
    const data = await buildLive();
    const body: ApiEnvelope<ApplicationsPayload> = {
      data,
      meta: { source: "live", generatedAt: new Date().toISOString() }
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiEnvelope<ApplicationsPayload> = {
      data: APPLICATIONS,
      meta: { source: "mock", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  }
}
