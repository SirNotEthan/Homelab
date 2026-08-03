"use client";

import { useState } from "react";
import StewardCore from "./components/StewardCore";
import { timeAgo, useApi } from "./lib/useApi";
import {
  findParticle,
  LINK_TYPE_LABEL,
  type AccessLevel,
  type ParticleCluster,
  type ParticleKind
} from "./data/stewardNodes";
import { MEMORY_ROWS, MEMORY_FILTERS } from "./data/memoryEntries";
import type {
  AiPayload,
  ArgoPayload,
  ClusterPayload,
  HomepageEvent,
  MonitoringPayload,
  StewardMode,
  StewardStatusPayload
} from "./lib/api-types";

const navItems = [
  ["overview", "Overview"],
  ["ai-core", "AI Core"],
  ["infrastructure", "Infra"],
  ["applications", "Apps"],
  ["home", "Home"],
  ["gitops", "GitOps"],
  ["memory", "Memory"]
] as const;

const NAV_ICON_PATHS: Record<(typeof navItems)[number][0], string> = {
  overview: "M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z",
  "ai-core": "M3 3h10v10H3zM6.5 3V1M9.5 3V1M6.5 15v-2M9.5 15v-2M3 6.5H1M3 9.5H1M15 6.5h-2M15 9.5h-2",
  infrastructure: "M2 2h12v3H2zM2 6.5h12v3H2zM2 11h12v3H2zM4.5 3.5h.01M4.5 8h.01M4.5 12.5h.01",
  applications: "M2 2h12v12H2zM2 6h12",
  home: "M2 8 8 2l6 6M4 7v7h8V7",
  gitops: "M4 3a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 4 3ZM4 9.8a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2ZM12 6a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 12 6ZM4 6.2v3.6M4 7.5c0 1 2 1 4.5 1S12 8 12 7.5",
  memory: "M8 3c2.76 0 5 .9 5 2s-2.24 2-5 2-5-.9-5-2 2.24-2 5-2ZM3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5M3 8c0 1.1 2.24 2 5 2s5-.9 5-2"
};

function NavIcon({ id }: { id: (typeof navItems)[number][0] }) {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={NAV_ICON_PATHS[id]} />
    </svg>
  );
}

type HudTone = "success" | "cyan" | "teal" | "dim";

type HudStat = {
  id: string;
  status: string;
  title: string;
  summary: string;
  tone: HudTone;
  lines?: string[];
  bars?: { label: string; percent: number }[];
};

function loadingStat(label: string): HudStat {
  return {
    id: `loading-${label.toLowerCase().replace(/\s+/g, "-")}`,
    status: "Syncing",
    title: label,
    summary: "Fetching live data...",
    tone: "dim"
  };
}

// --- Live data -> HudStat mappers -----------------------------------------

function clusterOverviewStat(cluster: ClusterPayload | null): HudStat {
  if (!cluster) return loadingStat("Kubernetes Cluster");
  const healthy = cluster.podFailures === 0 && cluster.nodesReady === cluster.nodesTotal;
  return {
    id: "k8s",
    status: healthy ? "Healthy" : "Attention",
    title: "Kubernetes Cluster",
    summary: `${cluster.nodesReady}/${cluster.nodesTotal} nodes ready`,
    tone: healthy ? "success" : "dim",
    bars: [
      { label: "CPU", percent: cluster.cpuPercent },
      { label: "Memory", percent: cluster.memoryPercent }
    ],
    lines: [`Pod failures - ${cluster.podFailures}`, `Ingress - ${cluster.ingressStatus}`]
  };
}

function aiOverviewStat(ai: AiPayload | null): HudStat {
  if (!ai) return loadingStat("AI Runtime");
  return {
    id: "ai-runtime",
    status: ai.runtime === "online" ? "Running" : ai.runtime === "degraded" ? "Degraded" : "Offline",
    title: "AI Runtime",
    summary: `${ai.activeModel} active`,
    tone: ai.runtime === "online" ? "cyan" : "dim",
    lines: [
      `${ai.modelsLoaded} models loaded`,
      ai.searchConnected ? "Search connected" : "Search disconnected",
      `${ai.computeMode} mode - node memory ${ai.aiNodeMemoryPercent}%`
    ]
  };
}

function monitoringOverviewStat(monitoring: MonitoringPayload | null): HudStat {
  if (!monitoring) return loadingStat("Observability");
  return {
    id: "observability",
    status: monitoring.alerts.active === 0 ? "Healthy" : "Alerting",
    title: "Observability",
    summary: `Grafana ${monitoring.grafana.status.toLowerCase()}`,
    tone: monitoring.alerts.active === 0 ? "success" : "dim",
    lines: [
      `Prometheus - ${monitoring.prometheus.targetsUp}/${monitoring.prometheus.targetsTotal} targets`,
      `Loki - ${(monitoring.loki.linesPerMinute / 1_000_000).toFixed(1)}M lines/min`,
      monitoring.alerts.lastResolved
    ]
  };
}

const STATIC_OVERVIEW_STATS: HudStat[] = [
  {
    id: "security",
    status: "Secure",
    title: "Security / Identity",
    summary: "Authentik online",
    tone: "teal",
    lines: ["Sealed Secrets healthy", "cert-manager - 12 certs valid"]
  },
  {
    id: "home",
    status: "Planned",
    title: "Home Automation",
    summary: "Home Assistant pending deploy",
    tone: "dim",
    lines: ["0 devices paired yet", "Rollout targeted Q3 2026"]
  }
];

function clusterContextStats(cluster: ClusterPayload | null, argo: ArgoPayload | null): HudStat[] {
  if (!cluster || !argo) return [loadingStat("Kubernetes")];
  const healthy = cluster.podFailures === 0 && cluster.nodesReady === cluster.nodesTotal;
  return [
    {
      id: "cluster-health",
      status: healthy ? "Healthy" : "Attention",
      title: "Cluster Health",
      summary: `${cluster.nodesReady}/${cluster.nodesTotal} nodes ready`,
      tone: healthy ? "success" : "dim",
      bars: [
        { label: "CPU", percent: cluster.cpuPercent },
        { label: "Memory", percent: cluster.memoryPercent }
      ],
      lines: [`Control plane - ${cluster.controlPlane}`, `etcd - ${cluster.etcd}`]
    },
    {
      id: "argo-apps",
      status: `${argo.summary.synced} Synced`,
      title: "Argo Apps",
      summary: `${argo.summary.synced}/${argo.apps.length} applications synced`,
      tone: "cyan",
      lines: argo.apps.slice(0, 3).map((app) => `${app.name} - ${app.syncStatus}`)
    },
    {
      id: "node-state",
      status: `${cluster.nodesReady} Ready`,
      title: "Node State",
      summary: cluster.nodes.map((node) => node.name).join(", "),
      tone: "success",
      lines: cluster.nodes.map((node) => `${node.name} - CPU ${node.cpuPercent}% / Mem ${node.memoryPercent}%`)
    },
    {
      id: "resource-pressure",
      status: cluster.podFailures === 0 ? "Nominal" : "Pressure",
      title: "Resource Pressure",
      summary: cluster.podFailures === 0 ? "No pressure events" : `${cluster.podFailures} pod failures`,
      tone: "teal",
      bars: [
        { label: "CPU", percent: cluster.cpuPercent },
        { label: "Memory", percent: cluster.memoryPercent }
      ]
    },
    {
      id: "recent-changes",
      status: `${cluster.recentChanges.length}`,
      title: "Recent Changes",
      summary: cluster.recentChanges[0] ?? "No recent changes",
      tone: "dim",
      lines: cluster.recentChanges.slice(1)
    }
  ];
}

function gitopsContextStats(argo: ArgoPayload | null): HudStat[] {
  if (!argo) return [loadingStat("GitOps")];
  return [
    {
      id: "sync-status",
      status: argo.summary.outOfSync === 0 ? "Synced" : "Out of Sync",
      title: "Sync Status",
      summary: `${argo.summary.synced}/${argo.apps.length} applications synced`,
      tone: "success",
      lines: [`Last deployment - ${argo.summary.lastDeployment.app} (${argo.summary.lastDeployment.when})`]
    },
    {
      id: "drift",
      status: argo.summary.outOfSync === 0 ? "None" : `${argo.summary.outOfSync}`,
      title: "Drift Detection",
      summary: argo.summary.outOfSync === 0 ? "No drift detected" : `${argo.summary.outOfSync} apps drifted`,
      tone: "teal"
    },
    {
      id: "degraded",
      status: `${argo.summary.degraded}`,
      title: "Degraded Apps",
      summary: argo.summary.degraded === 0 ? "All apps healthy" : `${argo.summary.degraded} degraded`,
      tone: argo.summary.degraded === 0 ? "success" : "dim"
    },
    {
      id: "apps",
      status: `${argo.apps.length}`,
      title: "Applications",
      summary: `${argo.apps.length} apps tracked`,
      tone: "cyan",
      lines: argo.apps.slice(0, 4).map((app) => `${app.name} - ${app.revision}`)
    }
  ];
}

function observabilityContextStats(monitoring: MonitoringPayload | null): HudStat[] {
  if (!monitoring) return [loadingStat("Observability")];
  return [
    {
      id: "grafana",
      status: monitoring.grafana.status,
      title: "Grafana",
      summary: `${monitoring.grafana.dashboards} dashboards loading`,
      tone: "success",
      lines: [`${monitoring.grafana.alertRules} alert rules configured`]
    },
    {
      id: "prometheus",
      status: `${monitoring.prometheus.targetsUp} Targets`,
      title: "Prometheus",
      summary: `${monitoring.prometheus.targetsUp}/${monitoring.prometheus.targetsTotal} targets up`,
      tone: "cyan",
      lines: [`Retention - ${monitoring.prometheus.retentionDays}d`, `Scrape interval - ${monitoring.prometheus.scrapeIntervalSeconds}s`]
    },
    {
      id: "loki",
      status: `${(monitoring.loki.linesPerMinute / 1_000_000).toFixed(1)}M/min`,
      title: "Loki",
      summary: `${(monitoring.loki.linesPerMinute / 1_000_000).toFixed(1)}M lines/min ingested`,
      tone: "teal",
      lines: [monitoring.loki.ingestionErrors === 0 ? "No ingestion errors" : `${monitoring.loki.ingestionErrors} ingestion errors`]
    },
    {
      id: "alerts",
      status: monitoring.alerts.active === 0 ? "0 Active" : `${monitoring.alerts.active} Active`,
      title: "Alerts",
      summary: monitoring.alerts.active === 0 ? "No active alerts" : `${monitoring.alerts.active} alerts firing`,
      tone: monitoring.alerts.active === 0 ? "success" : "dim",
      lines: [monitoring.alerts.lastResolved]
    }
  ];
}

function modelsContextStats(ai: AiPayload | null): HudStat[] {
  if (!ai) return [loadingStat("Models")];
  return [
    {
      id: "runtime",
      status: ai.runtime === "online" ? "Running" : "Offline",
      title: "AI Runtime",
      summary: `${ai.activeModel} active`,
      tone: "cyan",
      lines: [`${ai.modelsLoaded} models loaded`, `${ai.responseSpeedTokensPerSec} tok/s`]
    },
    {
      id: "registry",
      status: `${ai.models.length}`,
      title: "Model Registry",
      summary: `${ai.models.length} models tracked`,
      tone: "teal",
      lines: ai.models.map((model) => `${model.name} - ${model.sizeGb}GB${model.active ? " - active" : ""}`)
    },
    {
      id: "usage",
      status: "Nominal",
      title: "Resource Usage",
      summary: `Model storage ${ai.modelStorageUsedGb}/${ai.modelStorageTotalGb}GB`,
      tone: "success",
      bars: [{ label: "AI node memory", percent: ai.aiNodeMemoryPercent }]
    },
    {
      id: "last-test",
      status: "Tested",
      title: "Last Prompt Test",
      summary: ai.lastPromptTest.prompt,
      tone: "dim",
      lines: [ai.lastPromptTest.result, ai.lastPromptTest.at]
    }
  ];
}

// --- Static (non-live-backed) node contexts --------------------------------

type NodeContext = {
  label: string;
  focus: string;
  title: string;
  subtitle: string;
  stats: HudStat[];
};

const STATIC_NODE_CONTEXT: Record<string, NodeContext> = {
  identity: {
    label: "Identity",
    focus: "Security and identity",
    title: "Steward - Identity Context",
    subtitle: "authentication, secrets, and certificate health",
    stats: [
      {
        id: "authentik",
        status: "Online",
        title: "Authentik",
        summary: "SSO provider healthy",
        tone: "success",
        lines: ["3 apps federated", "No failed logins - 24h"]
      },
      {
        id: "sealed-secrets",
        status: "Healthy",
        title: "Sealed Secrets",
        summary: "Controller healthy",
        tone: "teal",
        lines: ["18 secrets managed"]
      },
      {
        id: "cert-manager",
        status: "12 Valid",
        title: "cert-manager",
        summary: "12 certs valid",
        tone: "success",
        lines: ["Next renewal - 41d"]
      }
    ]
  },
  search: {
    label: "Search",
    focus: "Search and retrieval",
    title: "Steward - Search Context",
    subtitle: "index health, crawl status, and query volume",
    stats: [
      {
        id: "index",
        status: "Connected",
        title: "Search Index",
        summary: "SearXNG connected",
        tone: "success",
        lines: ["4.2k documents indexed"]
      },
      {
        id: "crawl",
        status: "Fresh",
        title: "Last Crawl",
        summary: "roadmap.md - 10m ago",
        tone: "cyan",
        lines: ["Incremental crawl every 15m"]
      },
      {
        id: "queries",
        status: "38/day",
        title: "Query Volume",
        summary: "38 queries in last 24h",
        tone: "teal",
        lines: ["Avg latency - 220ms"]
      }
    ]
  },
  "home-automation": {
    label: "Home Automation",
    focus: "Home Assistant rollout",
    title: "Steward - Home Automation Context",
    subtitle: "rollout plan, device pairing, and integration status",
    stats: [
      {
        id: "rollout",
        status: "Planned",
        title: "Home Automation",
        summary: "Home Assistant pending deploy",
        tone: "dim",
        lines: ["0 devices paired yet", "Rollout targeted Q3 2026"]
      },
      {
        id: "plan",
        status: "Awaiting",
        title: "Deployment Plan",
        summary: "Helm chart prepared",
        tone: "cyan",
        lines: ["Awaiting your approval"]
      },
      {
        id: "integrations",
        status: "0",
        title: "Integrations",
        summary: "No integrations configured",
        tone: "dim",
        lines: ["Zigbee2MQTT - planned"]
      }
    ]
  },
  recovery: {
    label: "Recovery",
    focus: "Backup and recovery",
    title: "Steward - Recovery Context",
    subtitle: "backup schedule, snapshots, and recovery drills",
    stats: [
      {
        id: "backups",
        status: "Healthy",
        title: "Backup Job",
        summary: "Completed - 10:20",
        tone: "success",
        lines: ["Nightly schedule - 02:00"]
      },
      {
        id: "snapshots",
        status: "14",
        title: "Longhorn Snapshots",
        summary: "14 volumes snapshotted",
        tone: "teal",
        lines: ["Retention - 7 days"]
      },
      {
        id: "drills",
        status: "Passed",
        title: "Recovery Drills",
        summary: "Last drill - 3w ago",
        tone: "success",
        lines: ["Rebuilt Longhorn replica after node loss"]
      }
    ]
  },
  "personal-knowledge": {
    label: "Personal Knowledge",
    focus: "Personal knowledge base",
    title: "Steward - Personal Knowledge Context",
    subtitle: "notes, roadmap, and indexed conversations",
    stats: [
      {
        id: "notes",
        status: "Indexed",
        title: "Notes & Roadmap",
        summary: "roadmap.md indexed - 10m ago",
        tone: "cyan",
        lines: ["Config scans - 1w ago"]
      },
      {
        id: "conversations",
        status: "96%",
        title: "Conversation Memory",
        summary: "Prefers Argo CD over Flux",
        tone: "success",
        lines: ["Confidence - 96%"]
      },
      {
        id: "topology",
        status: "98%",
        title: "Home Network Topology",
        summary: "Learned from config scan",
        tone: "teal",
        lines: ["Confidence - 98%"]
      }
    ]
  },
  memory: {
    label: "Memory",
    focus: "Memory subsystem",
    title: "Steward - Memory Context",
    subtitle: "sources, confidence, and recent memory writes",
    stats: [
      {
        id: "sources",
        status: "4",
        title: "Memory Sources",
        summary: "roadmap.md",
        tone: "cyan",
        lines: ["model-registry.yaml", "Argo CD events", "Prometheus + Loki"]
      },
      {
        id: "writes",
        status: "New",
        title: "Recently Learned",
        summary: "Learned new node labels",
        tone: "success",
        lines: ["Indexed roadmap changes", "Correlated Loki logs with alerts"]
      },
      {
        id: "confidence",
        status: "High",
        title: "Average Confidence",
        summary: "92% across active memories",
        tone: "teal"
      }
    ]
  },
  reasoning: {
    label: "Reasoning",
    focus: "Active reasoning chain",
    title: "Steward - Reasoning Context",
    subtitle: "current chain of thought, confidence, and trust",
    stats: [
      {
        id: "chain",
        status: "Active",
        title: "Reasoning Chain",
        summary: "Evaluating Home Assistant rollout",
        tone: "cyan",
        lines: ["3 steps completed", "Awaiting approval to proceed"]
      },
      {
        id: "trust",
        status: "High",
        title: "Confidence & Trust",
        summary: "Current context - 99%",
        tone: "success",
        bars: [
          { label: "Current context", percent: 99 },
          { label: "Reasoning", percent: 97 }
        ]
      }
    ]
  },
  skills: {
    label: "Skills",
    focus: "Skill library",
    title: "Steward - Skills Context",
    subtitle: "learned skills and their confidence",
    stats: [
      {
        id: "skill-library",
        status: "98%",
        title: "Skill Library",
        summary: "cluster-status - 98%",
        tone: "cyan",
        lines: ["gitops-application - 94%", "repo-change - 91%", "node-scaling - 93%"]
      },
      {
        id: "taught",
        status: "5",
        title: "Taught Skills",
        summary: "5 skills taught by you",
        tone: "teal"
      }
    ]
  },
  tools: {
    label: "Tools",
    focus: "Tool permissions",
    title: "Steward - Tools Context",
    subtitle: "granted access and pending permission requests",
    stats: [
      {
        id: "permissions",
        status: "4",
        title: "Tool Permissions",
        summary: "Kubernetes API - read/write",
        tone: "teal",
        lines: ["Argo CD API - read-only", "Shell - approved", "Home Assistant - not yet granted"]
      }
    ]
  },
  context: {
    label: "Current Context",
    focus: "Active reasoning context",
    title: "Steward - Current Context",
    subtitle: "what Steward is actively reasoning about right now",
    stats: [
      {
        id: "active-context",
        status: "Active",
        title: "Active Reasoning",
        summary: "Home Assistant rollout",
        tone: "cyan",
        lines: ["3 steps completed", "Awaiting approval to proceed"]
      },
      {
        id: "context-confidence",
        status: "99%",
        title: "Context Confidence",
        summary: "High confidence in current framing",
        tone: "success",
        bars: [{ label: "Confidence", percent: 99 }]
      }
    ]
  },
  devices: {
    label: "Devices",
    focus: "Device registry",
    title: "Steward - Devices Context",
    subtitle: "paired devices and their trust status",
    stats: [
      {
        id: "device-registry",
        status: "0 Paired",
        title: "Device Registry",
        summary: "No devices paired yet",
        tone: "dim",
        lines: ["Registry opens with Home Assistant rollout"]
      },
      {
        id: "device-groups",
        status: "Planned",
        title: "Device Groups",
        summary: "Sensors, lights, cameras, assistants",
        tone: "dim",
        lines: ["Grouped by type once paired"]
      }
    ]
  },
  documents: {
    label: "Documents",
    focus: "Indexed documents",
    title: "Steward - Documents Context",
    subtitle: "indexed files and their freshness",
    stats: [
      {
        id: "indexed-docs",
        status: "Indexed",
        title: "Indexed Documents",
        summary: "roadmap.md - 10m ago",
        tone: "cyan",
        lines: ["model-registry.yaml", "Config scans - 1w ago"]
      },
      {
        id: "doc-confidence",
        status: "78%",
        title: "Document Confidence",
        summary: "Freshness-weighted average",
        tone: "teal",
        bars: [{ label: "Confidence", percent: 78 }]
      }
    ]
  }
};

const LIVE_NODE_META: Record<string, { label: string; focus: string; title: string; subtitle: string }> = {
  kubernetes: {
    label: "Kubernetes",
    focus: "Kubernetes cluster health",
    title: "Steward - Kubernetes Context",
    subtitle: "cluster health, Argo apps, node state, resource pressure, recent changes"
  },
  gitops: {
    label: "GitOps",
    focus: "GitOps delivery pipeline",
    title: "Steward - GitOps Context",
    subtitle: "sync status, drift detection, degraded apps, application inventory"
  },
  observability: {
    label: "Observability",
    focus: "Observability stack",
    title: "Steward - Observability Context",
    subtitle: "metrics, logs, alerts, and target health"
  },
  models: {
    label: "Models",
    focus: "AI model runtime",
    title: "Steward - Models Context",
    subtitle: "runtime status, loaded models, and registry"
  }
};

// --- Data status (loading / error / stale / retry) --------------------------

type DataStatus = {
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  stale: boolean;
  refetch: () => void;
};

function combineStatus(...states: DataStatus[]): DataStatus {
  return {
    loading: states.some((s) => s.loading),
    error: states.find((s) => s.error)?.error ?? null,
    lastUpdated: states.reduce<number | null>(
      (min, s) => (s.lastUpdated !== null && (min === null || s.lastUpdated < min) ? s.lastUpdated : min),
      null
    ),
    stale: states.some((s) => s.stale),
    refetch: () => states.forEach((s) => s.refetch())
  };
}

function DataStatusLine({ status, label }: { status: DataStatus; label: string }) {
  if (status.loading && !status.lastUpdated) {
    return <div className="data-status">Syncing {label}...</div>;
  }
  if (status.error) {
    return (
      <div className="data-status is-error">
        {label} failed to load - {status.error}
        <button type="button" onClick={status.refetch}>Retry</button>
      </div>
    );
  }
  return (
    <div className={`data-status${status.stale ? " is-stale" : ""}`}>
      {status.stale ? "Stale - " : ""}Updated {timeAgo(status.lastUpdated)}
      <button type="button" onClick={status.refetch}>Refresh</button>
    </div>
  );
}

function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-title">Homelab Core</div>
          <div className="brand-kicker">Steward - Private AI Command Center</div>
        </div>
      </div>
      <div className="command">
        <span className="pulse" />
        <span>Ask, search, command, diagnose...</span>
        <span className="subtle" style={{ marginLeft: "auto" }}>⌘K</span>
      </div>
      <div className="top-status">
        <span className="mono">00:30</span>
        <span className="chip"><span className="dot" />All systems nominal</span>
        <span className="chip">1</span>
        <span className="chip" style={{ background: "var(--text-primary)", color: "var(--void)" }}>S</span>
      </div>
    </header>
  );
}

function Sidebar({ active, setActive }: { active: string; setActive: (screen: string) => void }) {
  return (
    <nav className="sidebar" aria-label="Primary">
      {navItems.map(([id, label]) => (
        <button
          key={id}
          className={`nav-item ${active === id ? "active" : ""}`}
          onClick={() => setActive(id)}
          type="button"
          title={label}
          aria-label={label}
          aria-current={active === id ? "page" : undefined}
        >
          <NavIcon id={id} />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

const MODE_OPTIONS: { id: StewardMode; label: string }[] = [
  { id: "observe", label: "Observe" },
  { id: "diagnose", label: "Diagnose" },
  { id: "plan", label: "Plan" },
  { id: "teach", label: "Teach" },
  { id: "repair-proposal", label: "Repair Proposal" },
  { id: "execute", label: "Execute" }
];

const MODE_COPY: Record<StewardMode, string> = {
  observe: "Observing. I will surface what changes, not act on it.",
  diagnose: "Diagnosing. Ask me about any failing or degraded system.",
  plan: "Planning. I will draft a plan before touching anything.",
  teach: "Teach me. Correct a memory or show me a new skill.",
  "repair-proposal": "I have prepared a repair proposal. Nothing changes without your approval.",
  execute: "Executing approved actions only. Read-only outside the approval queue."
};

async function patchStewardStatus(body: Record<string, unknown>) {
  const res = await fetch("/api/steward/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function StewardPanel({ overrideFocus }: { overrideFocus?: string }) {
  const steward = useApi<StewardStatusPayload>("/api/steward/status");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [openRationale, setOpenRationale] = useState<string | null>(null);

  const data = steward.data;
  const mode = data?.mode ?? "observe";
  const modeLabel = MODE_OPTIONS.find((option) => option.id === mode)?.label ?? "Observe";

  async function setMode(next: StewardMode) {
    try {
      await patchStewardStatus({ type: "set-mode", mode: next });
      steward.refetch();
    } catch {
      // best-effort in mock mode; UI stays on last known state
    }
  }

  async function resolveApproval(id: string, action: "approve" | "dismiss") {
    setPendingAction(id);
    try {
      await patchStewardStatus({ type: action, id });
      steward.refetch();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <aside className="assistant-panel">
      <div className="steward-id">
        <div>
          <h2 className="steward-name">Steward</h2>
          <div className="subtle">Private AI command center</div>
        </div>
        <span className="steward-online"><span className="dot" />{data?.online === false ? "Offline" : "Online"}</span>
      </div>
      <div className="mode-banner">
        <span>Mode - {modeLabel}</span>
        <span className="subtle">Last checked {timeAgo(steward.lastUpdated)}</span>
      </div>
      <div className="steward-brief">
        <p className="subtle">Disposition - {data?.disposition ?? "Calm, watchful, awaiting approval"}</p>
        <p className="subtle">Current focus - {overrideFocus ?? data?.focus ?? "Home Assistant rollout"}</p>
        <p className="subtle">Operating mode - {data?.operatingMode ?? "Read-only, approval required"}</p>
        <p className="subtle">
          System confidence - {data?.confidence ?? "..."}%
          {data && (
            <span className="bar confidence-inline"><span style={{ width: `${data.confidence}%` }} /></span>
          )}
        </p>
      </div>
      <div className="trust-promise"><span className="dot" />Nothing changes without your approval</div>
      <div className="message">{MODE_COPY[mode]}</div>
      <div className="actions mode-grid">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={mode === option.id ? "active" : ""}
            onClick={() => setMode(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div>
        <h3 className="card-title">Approval queue</h3>
        {steward.loading && !data ? (
          <div className="skeleton-stack">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        ) : data && data.approvalQueue.length > 0 ? (
          <div className="approval-list">
            {data.approvalQueue.map((item) => (
              <div className={`approval-item approval-item--${item.risk}`} key={item.id}>
                <div className="approval-item-head">
                  <span className="approval-item-title">{item.title}</span>
                  <span className={`approval-item-risk approval-item-risk--${item.risk}`}>{item.risk} risk</span>
                </div>
                <p className="approval-item-desc">{item.description}</p>
                <p className="subtle">Requested {item.requestedAt}</p>
                <button
                  type="button"
                  className="rationale-toggle"
                  onClick={() => setOpenRationale((current) => (current === item.id ? null : item.id))}
                  aria-expanded={openRationale === item.id}
                >
                  {openRationale === item.id ? "Hide reasoning" : "Why I think this"}
                </button>
                {openRationale === item.id && <p className="rationale-text">{item.rationale}</p>}
                <div className="approval-item-actions">
                  <button
                    type="button"
                    className="approve"
                    disabled={pendingAction === item.id}
                    onClick={() => resolveApproval(item.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="dismiss"
                    disabled={pendingAction === item.id}
                    onClick={() => resolveApproval(item.id, "dismiss")}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">Nothing pending. Steward will not change anything without your approval.</p>
        )}
      </div>
      <div>
        <h3 className="card-title">Recent actions</h3>
        {steward.loading && !data ? (
          <div className="skeleton-stack">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        ) : (
          (data?.recentActions ?? []).map((action) => (
            <p className="subtle" key={`${action.text}-${action.when}`}>{action.text} - {action.when}</p>
          ))
        )}
      </div>
      <DataStatusLine status={steward} label="Steward status" />
      <div className="input-row">
        <input placeholder="Message Steward..." />
        <button className="send" type="button">Send</button>
      </div>
    </aside>
  );
}

function HudStub({ stat, expanded, onToggle }: { stat: HudStat; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`hud-stub tone-${stat.tone} ${expanded ? "expanded" : ""}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${stat.title} - ${stat.status}`}
    >
      <span className="hud-stub-head">
        <span className="hud-dot" />
        <span className="hud-title">{stat.title}</span>
        <span className="hud-status">{stat.status}</span>
      </span>
      <span className="hud-detail">
        <span className="hud-summary">{stat.summary}</span>
        {stat.bars?.map((bar) => (
          <span className="hud-bar-row" key={bar.label}>
            <span className="bar"><span style={{ width: `${bar.percent}%` }} /></span>
            <span className="hud-bar-label">{bar.label} - {bar.percent}%</span>
          </span>
        ))}
        {stat.lines?.map((line) => (
          <span className="hud-line" key={line}>{line}</span>
        ))}
      </span>
    </button>
  );
}

function HudCluster({ stats, variant }: { stats: HudStat[]; variant: "row" | "column" }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={`hud-cluster hud-cluster--${variant}`}>
      {stats.map((stat) => (
        <HudStub
          key={stat.id}
          stat={stat}
          expanded={expandedId === stat.id}
          onToggle={() => setExpandedId((current) => (current === stat.id ? null : stat.id))}
        />
      ))}
    </div>
  );
}

const KIND_LABEL: Record<ParticleKind, string> = {
  core: "Core",
  skill: "Skill",
  selfTaughtSkill: "Self-taught skill",
  device: "Device",
  service: "Service",
  memory: "Memory",
  tool: "Tool",
  automation: "Automation",
  alert: "Alert",
  document: "Document"
};

const CLUSTER_LABEL: Record<ParticleCluster, string> = {
  intelligence: "Intelligence",
  homelab: "Homelab",
  devices: "Devices",
  homeAutomation: "Home Automation",
  observability: "Observability",
  security: "Security",
  gitops: "GitOps",
  memory: "Memory"
};

const ACCESS_LABEL: Record<AccessLevel, string> = {
  read: "Read only",
  write: "Read / write",
  control: "Full control",
  none: "Nothing yet"
};

function scaleLabel(value: number): string {
  if (value >= 75) return `High (${value}%)`;
  if (value >= 45) return `Medium (${value}%)`;
  return `Low (${value}%)`;
}

function CorePanel({
  detail = false,
  defaultTitle,
  defaultSubtitle,
  defaultStats,
  clusterVariant,
  selectedId,
  onSelectNode,
  liveContext,
  dataStatus
}: {
  detail?: boolean;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultStats: HudStat[];
  clusterVariant: "row" | "column";
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  liveContext: Record<string, NodeContext>;
  dataStatus: DataStatus | null;
}) {
  const context = selectedId ? liveContext[selectedId] ?? STATIC_NODE_CONTEXT[selectedId] : null;
  const stats = context?.stats ?? defaultStats;
  const title = context?.title ?? defaultTitle;
  const subtitle = context?.subtitle ?? defaultSubtitle;
  const focusLabel = context?.focus ?? "Home Assistant rollout";
  const isLive = selectedId !== null && Boolean(LIVE_NODE_META[selectedId]);
  const selectedParticle = findParticle(selectedId);

  return (
    <section className="panel">
      <div className="panel-head">
        <h1 className="panel-title">{title}</h1>
        <div className="subtle">{subtitle}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <div className="chip">
            <span className="dot" />Active reasoning - {focusLabel}
          </div>
          {context && (
            <button type="button" className="chip focus-chip" onClick={() => onSelectNode(null)}>
              {context.label} focus - clear ✕
            </button>
          )}
        </div>
        {isLive && dataStatus && <DataStatusLine status={dataStatus} label={context?.label ?? "context"} />}
      </div>
      <div className="legend">
        <span><span className="dot" style={{ color: "var(--text-primary)" }} /> Cognitive</span>
        <span><span className="dot" style={{ color: "var(--teal)" }} /> Operational</span>
        <span><span className="dot" style={{ color: "var(--cyan)" }} /> Peripheral</span>
      </div>
      <div className="core-wrap">
        <StewardCore detail={detail} selectedId={selectedId} onSelectNode={onSelectNode} />
        <HudCluster key={`${clusterVariant}-${selectedId ?? "default"}`} stats={stats} variant={clusterVariant} />
      </div>
      {selectedParticle && (
        <div className={`inspector inspector--${clusterVariant}`}>
          <h3>Selected - {selectedParticle.label}</h3>
          <div className="kv">
            <span>Type</span><b>{KIND_LABEL[selectedParticle.kind]}</b>
            <span>Cluster</span><b>{CLUSTER_LABEL[selectedParticle.cluster]}</b>
            <span>Confidence</span><b>{selectedParticle.confidence}%</b>
            <span>Activation</span><b>{scaleLabel(selectedParticle.activation)}</b>
            <span>Trust</span><b>{scaleLabel(selectedParticle.trust)}</b>
            <span>Steward can</span><b>{ACCESS_LABEL[selectedParticle.access]}</b>
            {selectedParticle.approved === false && (
              <>
                <span>Approval</span><b className="pending-label">Awaiting your approval</b>
              </>
            )}
            {selectedParticle.hostedOn && (
              <>
                <span>Hosted on</span><b>{selectedParticle.hostedOn}</b>
              </>
            )}
            <span>Links</span>
            <b>
              {selectedParticle.links
                .map((link) => `${findParticle(link.target)?.label ?? link.target} (${LINK_TYPE_LABEL[link.type]})`)
                .join(", ") || "None"}
            </b>
            <span>Last learned</span><b>{selectedParticle.learnedAt ?? "Unknown"}</b>
            <span>Status</span><b>{selectedParticle.status ?? "Unknown"}</b>
          </div>
        </div>
      )}
    </section>
  );
}

function Timeline({ events, status }: { events: HomepageEvent[]; status: DataStatus }) {
  if (status.loading && events.length === 0) {
    return (
      <div className="log-strip">
        <span className="skeleton-line" style={{ width: 220 }} />
      </div>
    );
  }
  if (status.error && events.length === 0) {
    return (
      <div className="log-strip is-error">
        Timeline failed to load - {status.error}
        <button type="button" onClick={status.refetch}>Retry</button>
      </div>
    );
  }
  return (
    <div className="log-strip">
      {events.map((event, index) => (
        <span className="log-entry" key={event.id}>
          {index > 0 && <span className="log-divider">•</span>}
          <span className="log-time">{event.time}</span> {event.message}
        </span>
      ))}
    </div>
  );
}

type Screens = {
  liveContext: Record<string, NodeContext>;
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  overviewStats: HudStat[];
  aiCoreStats: HudStat[];
  events: HomepageEvent[];
  eventsStatus: DataStatus;
  contextDataStatus: (id: string | null) => DataStatus | null;
};

function OverviewScreen({ liveContext, selectedId, onSelectNode, overviewStats, events, eventsStatus, contextDataStatus }: Screens) {
  return (
    <section className="screen">
      <CorePanel
        defaultTitle="Steward - Intelligence Core"
        defaultSubtitle="a living orbital map of what Steward knows, trusts, and is reasoning about"
        defaultStats={overviewStats}
        clusterVariant="row"
        selectedId={selectedId}
        onSelectNode={onSelectNode}
        liveContext={liveContext}
        dataStatus={contextDataStatus(selectedId)}
      />
      <Timeline events={events} status={eventsStatus} />
    </section>
  );
}

function AiCoreScreen({ liveContext, selectedId, onSelectNode, aiCoreStats, events, eventsStatus, contextDataStatus }: Screens) {
  return (
    <section className="screen ai-core">
      <CorePanel
        detail
        defaultTitle="AI Core Detail - inside Steward's mind"
        defaultSubtitle="memory, reasoning, tools and trust, all at once"
        defaultStats={aiCoreStats}
        clusterVariant="column"
        selectedId={selectedId}
        onSelectNode={onSelectNode}
        liveContext={liveContext}
        dataStatus={contextDataStatus(selectedId)}
      />
      <Timeline events={events} status={eventsStatus} />
    </section>
  );
}


function TypeChip({ type }: { type: string }) {
  return <span className={`type-chip type-chip--${type.toLowerCase()}`}>{type}</span>;
}

function ConfidenceCell({ confidence }: { confidence: string }) {
  const percent = Number.parseInt(confidence, 10) || 0;
  return (
    <div className="confidence-cell">
      <span className="bar"><span style={{ width: `${percent}%` }} /></span>
      <span>{confidence}</span>
    </div>
  );
}

function MemoryScreen({
  events,
  eventsStatus,
  onViewInCore
}: {
  events: HomepageEvent[];
  eventsStatus: DataStatus;
  onViewInCore: (particleId: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const rows = MEMORY_ROWS.filter((row) => {
    if (filter !== "All" && row.category !== filter) return false;
    if (!search.trim()) return true;
    const haystack = `${row.entry} ${row.linked} ${row.source}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <section className="screen memory">
      <div className="panel library-panel">
        <div className="input-row">
          <input
            placeholder="Search memory, or teach Steward a new skill..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="teach" type="button">Teach</button>
        </div>
        <div className="filters">
          {MEMORY_FILTERS.map((option) => (
            <button
              type="button"
              className={`filter ${filter === option ? "active" : ""}`}
              key={option}
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Entry</th><th>Type</th><th>Conf.</th><th>Updated</th><th>Source</th><th>Linked</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.entry} className={row.category === "Conflicts" ? "row-conflict" : undefined}>
                  <td>{row.entry}</td>
                  <td><TypeChip type={row.type} /></td>
                  <td><ConfidenceCell confidence={row.confidence} /></td>
                  <td>{row.updated}</td>
                  <td>{row.source}</td>
                  <td>{row.linked}</td>
                  <td>
                    <button type="button" className="view-in-core" onClick={() => onViewInCore(row.particleId)}>
                      View in Core
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="empty-note">No entries match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Timeline events={events} status={eventsStatus} />
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState("overview");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const cluster = useApi<ClusterPayload>("/api/cluster");
  const argo = useApi<ArgoPayload>("/api/argocd");
  const monitoring = useApi<MonitoringPayload>("/api/monitoring");
  const ai = useApi<AiPayload>("/api/ai");
  const events = useApi<HomepageEvent[]>("/api/homepage/events");

  const overviewStats: HudStat[] = [
    clusterOverviewStat(cluster.data),
    aiOverviewStat(ai.data),
    monitoringOverviewStat(monitoring.data),
    ...STATIC_OVERVIEW_STATS
  ];

  const aiCoreStats: HudStat[] = [
    ...modelsContextStats(ai.data),
    ...clusterContextStats(cluster.data, argo.data).slice(0, 2)
  ];

  const liveContext: Record<string, NodeContext> = {
    kubernetes: { ...LIVE_NODE_META.kubernetes, stats: clusterContextStats(cluster.data, argo.data) },
    gitops: { ...LIVE_NODE_META.gitops, stats: gitopsContextStats(argo.data) },
    observability: { ...LIVE_NODE_META.observability, stats: observabilityContextStats(monitoring.data) },
    models: { ...LIVE_NODE_META.models, stats: modelsContextStats(ai.data) }
  };

  function contextDataStatus(id: string | null): DataStatus | null {
    switch (id) {
      case "kubernetes":
        return combineStatus(cluster, argo);
      case "gitops":
        return combineStatus(argo);
      case "observability":
        return combineStatus(monitoring);
      case "models":
        return combineStatus(ai);
      default:
        return null;
    }
  }

  const focusLabel =
    (selectedNode && (liveContext[selectedNode]?.focus ?? STATIC_NODE_CONTEXT[selectedNode]?.focus)) || undefined;

  const screenProps: Screens = {
    liveContext,
    selectedId: selectedNode,
    onSelectNode: setSelectedNode,
    overviewStats,
    aiCoreStats,
    events: events.data ?? [],
    eventsStatus: events,
    contextDataStatus
  };

  return (
    <div className="app-shell">
      <Header />
      <Sidebar active={active} setActive={setActive} />
      <main className="content">
        {active === "overview" && <OverviewScreen {...screenProps} />}
        {active === "ai-core" && <AiCoreScreen {...screenProps} />}
        {active === "memory" && (
          <MemoryScreen
            events={events.data ?? []}
            eventsStatus={events}
            onViewInCore={(particleId) => {
              setSelectedNode(particleId);
              setActive("overview");
            }}
          />
        )}
        {!["overview", "ai-core", "memory"].includes(active) && <OverviewScreen {...screenProps} />}
      </main>
      <StewardPanel overrideFocus={focusLabel} />
    </div>
  );
}
