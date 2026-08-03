import type { ClusterPayload } from "../lib/api-types";

export const CLUSTER_STATUS: ClusterPayload = {
  nodesReady: 4,
  nodesTotal: 4,
  nodes: [
    { name: "lab-01", ready: true, cpuPercent: 38, memoryPercent: 55 },
    { name: "lab-02", ready: true, cpuPercent: 33, memoryPercent: 49 },
    { name: "lab-03", ready: true, cpuPercent: 61, memoryPercent: 72 },
    { name: "lab-04", ready: true, cpuPercent: 27, memoryPercent: 44 }
  ],
  cpuPercent: 42,
  memoryPercent: 61,
  podFailures: 0,
  pvcHealthy: 9,
  pvcTotal: 9,
  longhorn: { healthy: 9, degraded: 0, faulted: 0 },
  ingressStatus: "Healthy",
  certificatesExpiringSoon: [{ name: "grafana.home.arpa", expiresInDays: 41 }],
  controlPlane: "stable",
  etcd: "healthy",
  recentChanges: ["Node labels updated", "kubelet config reloaded on lab-03"]
};
