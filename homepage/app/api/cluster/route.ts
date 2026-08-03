import { NextResponse } from "next/server";
import type { ApiEnvelope, ClusterPayload } from "../../lib/api-types";
import { CLUSTER_STATUS } from "../../data/clusterStatus";
import { coreApi, customApi, metricsApi } from "../../lib/k8s";

function parseCpu(value?: string): number {
  if (!value) return 0;
  if (value.endsWith("n")) return parseInt(value, 10) / 1e9;
  if (value.endsWith("u")) return parseInt(value, 10) / 1e6;
  if (value.endsWith("m")) return parseInt(value, 10) / 1000;
  return parseFloat(value);
}

function parseMem(value?: string): number {
  if (!value) return 0;
  const units: Record<string, number> = { Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3, Ti: 1024 ** 4 };
  for (const [suffix, mult] of Object.entries(units)) {
    if (value.endsWith(suffix)) return parseInt(value, 10) * mult;
  }
  return parseFloat(value);
}

async function buildLive(): Promise<ClusterPayload> {
  const core = coreApi();
  const custom = customApi();

  const [nodesRes, podsRes, pvcsRes] = await Promise.all([
    core.listNode(),
    core.listPodForAllNamespaces(),
    core.listPersistentVolumeClaimForAllNamespaces()
  ]);

  const nodeList = nodesRes.items;

  const metricsByNode = new Map<string, { cpu: number; mem: number }>();
  try {
    const nodeMetrics = await metricsApi().getNodeMetrics();
    for (const m of nodeMetrics.items) {
      metricsByNode.set(m.metadata.name, { cpu: parseCpu(m.usage.cpu), mem: parseMem(m.usage.memory) });
    }
  } catch {
    // metrics-server not installed - node cpu/mem stay at 0
  }

  const nodes = nodeList.map((node) => {
    const name = node.metadata?.name ?? "unknown";
    const ready = (node.status?.conditions ?? []).some((c) => c.type === "Ready" && c.status === "True");
    const usage = metricsByNode.get(name);
    const allocCpu = parseCpu(node.status?.allocatable?.cpu);
    const allocMem = parseMem(node.status?.allocatable?.memory);
    const cpuPercent = usage && allocCpu ? Math.round((usage.cpu / allocCpu) * 100) : 0;
    const memoryPercent = usage && allocMem ? Math.round((usage.mem / allocMem) * 100) : 0;
    return { name, ready, cpuPercent, memoryPercent };
  });

  const podFailures = podsRes.items.filter((pod) => {
    if (pod.status?.phase === "Failed") return true;
    return (pod.status?.containerStatuses ?? []).some((cs) => {
      const reason = cs.state?.waiting?.reason ?? "";
      return ["CrashLoopBackOff", "Error", "ImagePullBackOff", "ErrImagePull"].includes(reason);
    });
  }).length;

  const pvcTotal = pvcsRes.items.length;
  const pvcHealthy = pvcsRes.items.filter((pvc) => pvc.status?.phase === "Bound").length;

  let longhorn = { healthy: 0, degraded: 0, faulted: 0 };
  try {
    const volumes = (await custom.listClusterCustomObject({
      group: "longhorn.io",
      version: "v1beta2",
      plural: "volumes"
    })) as { items?: { status?: { robustness?: string } }[] };
    for (const v of volumes.items ?? []) {
      const r = v.status?.robustness;
      if (r === "healthy") longhorn.healthy++;
      else if (r === "degraded") longhorn.degraded++;
      else if (r === "faulted") longhorn.faulted++;
    }
  } catch {
    longhorn = CLUSTER_STATUS.longhorn;
  }

  let certificatesExpiringSoon: ClusterPayload["certificatesExpiringSoon"] = [];
  try {
    const certs = (await custom.listClusterCustomObject({
      group: "cert-manager.io",
      version: "v1",
      plural: "certificates"
    })) as { items?: { metadata?: { name?: string }; status?: { notAfter?: string } }[] };
    const now = Date.now();
    certificatesExpiringSoon = (certs.items ?? [])
      .map((c) => {
        const notAfter = c.status?.notAfter ? new Date(c.status.notAfter).getTime() : null;
        const expiresInDays = notAfter ? Math.round((notAfter - now) / 86_400_000) : null;
        return { name: c.metadata?.name ?? "unknown", expiresInDays };
      })
      .filter((c): c is { name: string; expiresInDays: number } => c.expiresInDays !== null && c.expiresInDays < 60);
  } catch {
    certificatesExpiringSoon = CLUSTER_STATUS.certificatesExpiringSoon;
  }

  let recentChanges: string[] = [];
  try {
    const events = await core.listEventForAllNamespaces();
    recentChanges = events.items
      .filter((e) => e.type === "Warning" || e.reason === "SuccessfulCreate" || e.reason === "Started")
      .sort((a, b) => {
        const at = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
        const bt = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
        return bt - at;
      })
      .slice(0, 6)
      .map((e) => `${e.involvedObject?.name ?? "resource"}: ${e.message ?? e.reason ?? ""}`.trim());
  } catch {
    recentChanges = CLUSTER_STATUS.recentChanges;
  }

  const controlPlaneNodes = nodeList.filter(
    (n) => n.metadata?.labels?.["node-role.kubernetes.io/control-plane"] !== undefined
  );
  const controlPlaneReady = controlPlaneNodes.length > 0 && controlPlaneNodes.every((n) =>
    (n.status?.conditions ?? []).some((c) => c.type === "Ready" && c.status === "True")
  );

  return {
    nodesReady: nodes.filter((n) => n.ready).length,
    nodesTotal: nodes.length,
    nodes,
    cpuPercent: nodes.length ? Math.round(nodes.reduce((s, n) => s + n.cpuPercent, 0) / nodes.length) : 0,
    memoryPercent: nodes.length ? Math.round(nodes.reduce((s, n) => s + n.memoryPercent, 0) / nodes.length) : 0,
    podFailures,
    pvcHealthy,
    pvcTotal,
    longhorn,
    ingressStatus: podFailures === 0 ? "Healthy" : "Degraded",
    certificatesExpiringSoon,
    controlPlane: controlPlaneReady ? "stable" : "degraded",
    etcd: controlPlaneReady ? "healthy" : "unknown",
    recentChanges
  };
}

export async function GET() {
  try {
    const data = await buildLive();
    const body: ApiEnvelope<ClusterPayload> = {
      data,
      meta: { source: "live", generatedAt: new Date().toISOString() }
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiEnvelope<ClusterPayload> = {
      data: CLUSTER_STATUS,
      meta: { source: "mock", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  }
}
