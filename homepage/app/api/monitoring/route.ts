import { NextResponse } from "next/server";
import type { ApiEnvelope, MonitoringPayload } from "../../lib/api-types";
import { MONITORING_STATUS } from "../../data/monitoringStatus";

const PROM_BASE = process.env.PROMETHEUS_BASE_URL ?? "http://monitoring-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090";
const ALERTMANAGER_BASE = process.env.ALERTMANAGER_BASE_URL ?? "http://monitoring-kube-prometheus-alertmanager.monitoring.svc.cluster.local:9093";
const GRAFANA_BASE = process.env.GRAFANA_BASE_URL ?? "http://monitoring-grafana.monitoring.svc.cluster.local";

async function fetchJson(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function buildLive(): Promise<MonitoringPayload> {
  const [targets, rules, retentionFlags, alerts] = await Promise.all([
    fetchJson(`${PROM_BASE}/api/v1/targets`),
    fetchJson(`${PROM_BASE}/api/v1/rules`),
    fetchJson(`${PROM_BASE}/api/v1/status/flags`),
    fetchJson(`${ALERTMANAGER_BASE}/api/v2/alerts?active=true`)
  ]);

  const activeTargets = targets?.data?.activeTargets ?? [];
  const targetsTotal = activeTargets.length;
  const targetsUp = activeTargets.filter((t: { health?: string }) => t.health === "up").length;

  const alertRules = (rules?.data?.groups ?? []).reduce(
    (sum: number, g: { rules?: unknown[] }) => sum + (g.rules?.length ?? 0),
    0
  );

  const retentionRaw: string = retentionFlags?.data?.["storage.tsdb.retention.time"] ?? "";
  const retentionDays = retentionRaw.endsWith("d") ? parseInt(retentionRaw, 10) : MONITORING_STATUS.prometheus.retentionDays;

  let grafanaStatus = "Unknown";
  try {
    const health = await fetchJson(`${GRAFANA_BASE}/api/health`, 2500);
    grafanaStatus = health?.database === "ok" ? "Healthy" : "Degraded";
  } catch {
    grafanaStatus = "Unreachable";
  }

  return {
    grafana: { status: grafanaStatus, dashboards: MONITORING_STATUS.grafana.dashboards, alertRules },
    prometheus: {
      targetsUp,
      targetsTotal,
      retentionDays,
      scrapeIntervalSeconds: MONITORING_STATUS.prometheus.scrapeIntervalSeconds
    },
    loki: MONITORING_STATUS.loki,
    alerts: {
      active: Array.isArray(alerts) ? alerts.length : 0,
      lastResolved: MONITORING_STATUS.alerts.lastResolved
    }
  };
}

export async function GET() {
  try {
    const data = await buildLive();
    const body: ApiEnvelope<MonitoringPayload> = {
      data,
      meta: { source: "live", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiEnvelope<MonitoringPayload> = {
      data: MONITORING_STATUS,
      meta: { source: "mock", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  }
}
