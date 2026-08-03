export type ApiEnvelope<T> = {
  data: T;
  meta: {
    source: "mock" | "live";
    generatedAt: string;
    degraded?: boolean;
  };
};

export type ClusterNode = {
  name: string;
  ready: boolean;
  cpuPercent: number;
  memoryPercent: number;
};

export type ClusterPayload = {
  nodesReady: number;
  nodesTotal: number;
  nodes: ClusterNode[];
  cpuPercent: number;
  memoryPercent: number;
  podFailures: number;
  pvcHealthy: number;
  pvcTotal: number;
  longhorn: { healthy: number; degraded: number; faulted: number };
  ingressStatus: string;
  certificatesExpiringSoon: { name: string; expiresInDays: number }[];
  controlPlane: string;
  etcd: string;
  recentChanges: string[];
};

export type ArgoApp = {
  name: string;
  syncStatus: "Synced" | "OutOfSync";
  healthStatus: "Healthy" | "Progressing" | "Degraded" | "Missing";
  revision: string;
  lastSyncAt: string;
  url: string;
};

export type ArgoPayload = {
  apps: ArgoApp[];
  summary: {
    synced: number;
    degraded: number;
    outOfSync: number;
    lastDeployment: { app: string; when: string };
  };
};

export type MonitoringPayload = {
  grafana: { status: string; dashboards: number; alertRules: number };
  prometheus: { targetsUp: number; targetsTotal: number; retentionDays: number; scrapeIntervalSeconds: number };
  loki: { linesPerMinute: number; ingestionErrors: number };
  alerts: { active: number; lastResolved: string };
};

export type AiPayload = {
  runtime: "online" | "offline" | "degraded";
  modelsLoaded: number;
  models: { name: string; sizeGb: number; active: boolean }[];
  activeModel: string;
  responseSpeedTokensPerSec: number;
  modelStorageUsedGb: number;
  modelStorageTotalGb: number;
  searchConnected: boolean;
  computeMode: "GPU" | "CPU";
  aiNodeMemoryPercent: number;
  lastPromptTest: { prompt: string; result: string; at: string };
};

export type HomepageEvent = {
  id: string;
  time: string;
  message: string;
  source: "argocd" | "kubernetes" | "steward" | "authentik" | "backup" | "git";
};

export type StewardMode = "observe" | "diagnose" | "plan" | "teach" | "repair-proposal" | "execute";

export type ApprovalItem = {
  id: string;
  title: string;
  description: string;
  rationale: string;
  requestedAt: string;
  risk: "low" | "medium" | "high";
};

export type StewardStatusPayload = {
  disposition: string;
  focus: string;
  mode: StewardMode;
  operatingMode: string;
  online: boolean;
  confidence: number;
  recentActions: { text: string; when: string }[];
  approvalQueue: ApprovalItem[];
};
