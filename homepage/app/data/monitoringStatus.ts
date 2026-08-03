import type { MonitoringPayload } from "../lib/api-types";

export const MONITORING_STATUS: MonitoringPayload = {
  grafana: { status: "Healthy", dashboards: 14, alertRules: 2 },
  prometheus: { targetsUp: 214, targetsTotal: 214, retentionDays: 30, scrapeIntervalSeconds: 15 },
  loki: { linesPerMinute: 1_200_000, ingestionErrors: 0 },
  alerts: { active: 0, lastResolved: "11:30 - high memory auto-resolved" }
};
