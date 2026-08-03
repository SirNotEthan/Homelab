"use client";

import { Fragment, useEffect, useState } from "react";
import { timeAgo, useApi } from "./lib/useApi";
import type {
  AiPayload,
  ApplicationItem,
  ApplicationsPayload,
  ArgoPayload,
  ClusterPayload,
  HomepageEvent,
  MonitoringPayload,
  RickMode,
  RickStatusPayload,
  SettingsPayload
} from "./lib/api-types";
import { KNOWLEDGE_ITEMS, findKnowledgeItem, type KnowledgeItem } from "./data/rickNodes";
import { MEMORY_ROWS, MEMORY_FILTERS } from "./data/memoryEntries";

const NAV_ITEMS = [
  ["overview", "Overview"],
  ["infrastructure", "Infrastructure"],
  ["applications", "Applications"],
  ["automation", "Automation"],
  ["memory", "Memory"],
  ["logs", "Logs"],
  ["settings", "Settings"]
] as const;

type ScreenId = (typeof NAV_ITEMS)[number][0];

const NAV_ICON_PATHS: Record<ScreenId, string> = {
  overview: "M1 1h6v9H1zM9 1h6v4H9zM9 7h6v8H9zM1 12h6v3H1z",
  infrastructure: "M2 2h12v3H2zM2 6.5h12v3H2zM2 11h12v3H2zM4.5 3.5h.01M4.5 8h.01M4.5 12.5h.01",
  applications: "M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z",
  automation: "M2 8 8 2l6 6M4 7v7h8V7",
  memory: "M8 3c2.76 0 5 .9 5 2s-2.24 2-5 2-5-.9-5-2 2.24-2 5-2ZM3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5M3 8c0 1.1 2.24 2 5 2s5-.9 5-2",
  logs: "M2 3h12M2 7.5h12M2 12h8",
  settings:
    "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"
};

function NavIcon({ id }: { id: ScreenId }) {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={NAV_ICON_PATHS[id]} />
    </svg>
  );
}

// --- Data status (loading / error / stale / retry) --------------------------

type DataStatus = {
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  stale: boolean;
  refetch: () => void;
};

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
    <div className="data-status">
      Updated {timeAgo(status.lastUpdated)}
      <button type="button" onClick={status.refetch}>Refresh</button>
    </div>
  );
}

// --- Summary rows (Infrastructure / Automation / Overview) -----------------

type DetailRow = { k: string; v: string };
type SummaryStatus = "good" | "warn" | "bad";
type SummaryItem = {
  id: string;
  name: string;
  status: SummaryStatus;
  state: string;
  detail: DetailRow[];
  lines?: string[];
};

function loadingSummary(id: string, name: string): SummaryItem {
  return { id, name, status: "warn", state: "Syncing...", detail: [] };
}

function kubernetesSummary(cluster: ClusterPayload | null, argo: ArgoPayload | null): SummaryItem {
  if (!cluster || !argo) return loadingSummary("kubernetes", "Kubernetes");
  const healthy = cluster.podFailures === 0 && cluster.nodesReady === cluster.nodesTotal;
  return {
    id: "kubernetes",
    name: "Kubernetes",
    status: healthy ? "good" : "warn",
    state: healthy ? "Healthy" : "Attention",
    detail: [
      { k: "Nodes", v: `${cluster.nodesReady}/${cluster.nodesTotal} ready` },
      { k: "CPU", v: `${cluster.cpuPercent}%` },
      { k: "Memory", v: `${cluster.memoryPercent}%` },
      { k: "Pod failures", v: `${cluster.podFailures}` },
      { k: "Last sync", v: `Argo CD - ${argo.summary.lastDeployment.when}` }
    ]
  };
}

function gitopsSummary(argo: ArgoPayload | null): SummaryItem {
  if (!argo) return loadingSummary("gitops", "GitOps");
  const healthy = argo.summary.outOfSync === 0 && argo.summary.degraded === 0;
  return {
    id: "gitops",
    name: "GitOps",
    status: healthy ? "good" : "warn",
    state: healthy ? "Healthy" : "Attention",
    detail: [
      { k: "Synced", v: `${argo.summary.synced}/${argo.apps.length} apps` },
      { k: "Degraded", v: `${argo.summary.degraded}` },
      { k: "Out of sync", v: `${argo.summary.outOfSync}` },
      { k: "Last deployment", v: `${argo.summary.lastDeployment.app} - ${argo.summary.lastDeployment.when}` }
    ],
    lines: argo.apps.slice(0, 4).map((app) => `${app.name} - ${app.revision}`)
  };
}

function observabilitySummary(monitoring: MonitoringPayload | null): SummaryItem {
  if (!monitoring) return loadingSummary("observability", "Observability");
  const healthy = monitoring.alerts.active === 0;
  return {
    id: "observability",
    name: "Observability",
    status: healthy ? "good" : "warn",
    state: healthy ? "Healthy" : "Alerting",
    detail: [
      { k: "Grafana", v: monitoring.grafana.status },
      { k: "Prometheus", v: `${monitoring.prometheus.targetsUp}/${monitoring.prometheus.targetsTotal} targets` },
      { k: "Loki", v: `${(monitoring.loki.linesPerMinute / 1_000_000).toFixed(1)}M lines/min` },
      { k: "Active alerts", v: `${monitoring.alerts.active}` },
      { k: "Last resolved", v: monitoring.alerts.lastResolved }
    ]
  };
}

function aiRuntimeSummary(ai: AiPayload | null): SummaryItem {
  if (!ai) return loadingSummary("ai-runtime", "AI Runtime");
  const healthy = ai.runtime === "online";
  return {
    id: "ai-runtime",
    name: "AI Runtime",
    status: healthy ? "good" : "warn",
    state: healthy ? "Healthy" : "Degraded",
    detail: [
      { k: "Active model", v: ai.activeModel },
      { k: "Models loaded", v: `${ai.modelsLoaded}` },
      { k: "Compute", v: ai.computeMode },
      { k: "Node memory", v: `${ai.aiNodeMemoryPercent}%` },
      { k: "Search", v: ai.searchConnected ? "Connected" : "Disconnected" }
    ]
  };
}

function securitySummary(): SummaryItem {
  const identity = findKnowledgeItem("identity");
  return {
    id: "security",
    name: "Security",
    status: "good",
    state: "Healthy",
    detail: [
      { k: "Identity provider", v: "Authentik online" },
      { k: "Sealed secrets", v: "Controller healthy" },
      { k: "Certificates", v: "12 valid" },
      { k: "Trust", v: identity ? `${identity.trust}%` : "-" }
    ]
  };
}

function homeAutomationSummary(): SummaryItem {
  return {
    id: "home-automation",
    name: "Home Automation",
    status: "warn",
    state: "Pending",
    detail: [
      { k: "Devices paired", v: "0" },
      { k: "Deployment plan", v: "Helm chart prepared" },
      { k: "Target", v: "Q3 2026" }
    ]
  };
}

// --- Suggested prompts / command palette ------------------------------------

type PromptAction = {
  id: string;
  label: string;
  mode?: RickMode;
  navigate?: ScreenId;
};

const PROMPT_ACTIONS: PromptAction[] = [
  { id: "diagnose", label: "Diagnose cluster", mode: "diagnose" },
  { id: "deploy-ha", label: "Deploy Home Assistant", navigate: "automation" },
  { id: "review-logs", label: "Review logs", navigate: "logs" },
  { id: "summarize-alerts", label: "Summarize alerts", mode: "diagnose" },
  { id: "teach-skill", label: "Teach new skill", mode: "teach" }
];

async function patchRickStatus(body: Record<string, unknown>) {
  const res = await fetch("/api/rick/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function CommandPalette({
  onClose,
  onRun
}: {
  onClose: () => void;
  onRun: (action: PromptAction) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = PROMPT_ACTIONS.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          className="palette-input"
          placeholder="Ask Rick..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="palette-list">
          {matches.map((action) => (
            <button key={action.id} type="button" className="palette-item" onClick={() => onRun(action)}>
              {action.label}
              <span className="hint">{action.navigate ? `go to ${action.navigate}` : action.mode}</span>
            </button>
          ))}
          {matches.length === 0 && <div className="empty-note" style={{ padding: "10px 12px" }}>No matching action.</div>}
        </div>
      </div>
    </div>
  );
}

// --- Header + Sidebar --------------------------------------------------------

function Header({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-title">Homelab Core</div>
      </div>
      <button type="button" className="command" onClick={onOpenPalette} style={{ cursor: "pointer" }}>
        <span>Ask Rick, search, diagnose...</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="top-status">
        <span className="mono">00:30</span>
        <span><span className="status-dot good" /> All systems nominal</span>
        <div className="avatar">R</div>
      </div>
    </header>
  );
}

function Sidebar({ active, setActive }: { active: ScreenId; setActive: (screen: ScreenId) => void }) {
  return (
    <nav className="sidebar" aria-label="Primary">
      {NAV_ITEMS.map(([id, label]) => (
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
          {label}
        </button>
      ))}
    </nav>
  );
}

// --- Summary list (shared by Overview + Infrastructure + Automation) -------

function SummaryList({ items }: { items: SummaryItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {items.map((item) => {
        const expanded = expandedId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="summary-row"
              onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              aria-expanded={expanded}
            >
              <span className="name">
                <span className={`status-dot ${item.status}`} />
                {item.name}
              </span>
              <span className={`state ${item.status !== "good" ? item.status : ""}`}>
                {item.state}
                <span className="chevron">{expanded ? "︿" : "﹀"}</span>
              </span>
            </button>
            {expanded && (
              <div className="summary-detail">
                {item.detail.map((row) => (
                  <Fragment key={row.k}>
                    <span className="k">{row.k}</span>
                    <span className="v">{row.v}</span>
                  </Fragment>
                ))}
                {item.lines && item.lines.length > 0 && (
                  <div className="summary-detail-lines">
                    {item.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Activity list ------------------------------------------------------------

function ActivityList({ events, status, limit }: { events: HomepageEvent[]; status: DataStatus; limit?: number }) {
  const list = limit ? events.slice(0, limit) : events;

  if (status.loading && events.length === 0) {
    return <span className="skeleton-line" style={{ width: 220 }} />;
  }
  if (status.error && events.length === 0) {
    return (
      <div className="data-status is-error">
        Activity failed to load - {status.error}
        <button type="button" onClick={status.refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {list.map((event) => (
        <div className="activity-row" key={event.id}>
          <span className="t mono">{event.time}</span>
          <span>{event.message}</span>
          <span className="src mono">{event.source}</span>
        </div>
      ))}
    </div>
  );
}

// --- Screens -----------------------------------------------------------------

type SharedData = {
  cluster: ReturnType<typeof useApi<ClusterPayload>>;
  argo: ReturnType<typeof useApi<ArgoPayload>>;
  monitoring: ReturnType<typeof useApi<MonitoringPayload>>;
  ai: ReturnType<typeof useApi<AiPayload>>;
  events: ReturnType<typeof useApi<HomepageEvent[]>>;
  applications: ReturnType<typeof useApi<ApplicationsPayload>>;
  rick: ReturnType<typeof useApi<RickStatusPayload>>;
  onResolveApproval: (id: string, action: "approve" | "dismiss") => void;
};

function OverviewScreen({ cluster, argo, monitoring, ai, events, rick, onResolveApproval }: SharedData) {
  const data = rick.data;
  const topApproval = data?.approvalQueue[0] ?? null;
  const [showRationale, setShowRationale] = useState(false);

  const infraItems: SummaryItem[] = [
    kubernetesSummary(cluster.data, argo.data),
    aiRuntimeSummary(ai.data),
    securitySummary(),
    homeAutomationSummary()
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Is everything healthy? What needs your attention? What&apos;s next?</p>
        </div>
      </div>

      <div className="panel panel-pad">
        <p className="panel-title">Current mission</p>
        <p className="mission-goal">{data?.focus ?? "..."}</p>
        <p className={`mission-status ${topApproval ? "warn" : "good"}`}>
          <span className={`status-dot ${topApproval ? "warn" : "good"}`} />
          {topApproval ? "Awaiting your approval" : "On track"}
        </p>
        <div className="mission-kv">
          <span className="k">Next action</span>
          <span className="v">{topApproval?.title ?? "Nothing pending"}</span>
          <span className="k">Last action</span>
          <span className="v">
            {data?.recentActions[0] ? `${data.recentActions[0].text} - ${data.recentActions[0].when}` : "-"}
          </span>
          <span className="k">Confidence</span>
          <span className="v">{data ? `${data.confidence}%` : "-"}</span>
        </div>
        {topApproval && (
          <>
            <div className="mission-actions">
              <button type="button" className="btn btn-primary" onClick={() => onResolveApproval(topApproval.id, "approve")}>
                Approve
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowRationale((v) => !v)}>
                Review
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onResolveApproval(topApproval.id, "dismiss")}>
                Dismiss
              </button>
            </div>
            {showRationale && <p className="subtle" style={{ marginTop: 10 }}>{topApproval.rationale}</p>}
          </>
        )}
        <DataStatusLine status={rick} label="mission" />
      </div>

      <div className="panel panel-pad">
        <p className="panel-title">Infrastructure</p>
        <SummaryList items={infraItems} />
      </div>

      <div className="panel panel-pad">
        <p className="panel-title" style={{ display: "flex", justifyContent: "space-between" }}>
          Ask Rick <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "none", letterSpacing: 0 }}>⌘K from anywhere</span>
        </p>
        <div className="ask-input">Press ⌘K to ask Rick...</div>
        <div className="ask-chips">
          {PROMPT_ACTIONS.map((action) => (
            <span key={action.id} className="chip">{action.label}</span>
          ))}
        </div>
      </div>

      <div className="panel panel-pad">
        <p className="panel-title">Recent activity</p>
        <ActivityList events={events.data ?? []} status={events} limit={5} />
      </div>
    </div>
  );
}

function InfrastructureScreen({ cluster, argo, monitoring, ai }: SharedData) {
  const items: SummaryItem[] = [
    kubernetesSummary(cluster.data, argo.data),
    gitopsSummary(argo.data),
    observabilitySummary(monitoring.data),
    aiRuntimeSummary(ai.data),
    securitySummary()
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Infrastructure</h1>
          <p className="page-sub">Kubernetes, GitOps, observability, AI runtime, and security.</p>
        </div>
      </div>
      <div className="panel panel-pad">
        <SummaryList items={items} />
      </div>
    </div>
  );
}

function ApplicationsScreen({ applications }: SharedData) {
  const apps = applications.data?.apps ?? [];
  const groups = Array.from(new Set(apps.map((app) => app.group)));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-sub">Everything deployed to the cluster. Amber means it still needs a manual step.</p>
        </div>
      </div>

      {applications.loading && apps.length === 0 && <span className="skeleton-line" style={{ width: 220 }} />}
      {applications.error && apps.length === 0 && (
        <div className="data-status is-error">
          Applications failed to load - {applications.error}
          <button type="button" onClick={applications.refetch}>Retry</button>
        </div>
      )}

      {groups.map((group) => (
        <div className="panel panel-pad app-group" key={group}>
          <p className="panel-title">{group}</p>
          <div className="app-grid">
            {apps
              .filter((app) => app.group === group)
              .map((app: ApplicationItem) => (
                <a key={app.id} className="app-tile" href={app.url} target="_blank" rel="noreferrer">
                  <span className="name">
                    <span className={`status-dot ${app.status === "healthy" ? "good" : app.status === "attention" ? "warn" : "bad"}`} />
                    {app.name}
                  </span>
                  <span className="meta">{app.detail}</span>
                </a>
              ))}
          </div>
        </div>
      ))}
      <DataStatusLine status={applications} label="applications" />
    </div>
  );
}

function AutomationScreen(_props: SharedData) {
  const homeAutomation = homeAutomationSummary();
  const devices = findKnowledgeItem("devices");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation</h1>
          <p className="page-sub">Home Assistant rollout and device registry.</p>
        </div>
      </div>
      <div className="panel panel-pad">
        <SummaryList items={[homeAutomation]} />
      </div>
      <div className="panel panel-pad">
        <p className="panel-title">Devices</p>
        <div className="mission-kv">
          <span className="k">Paired</span>
          <span className="v">{devices?.status ?? "0"}</span>
          <span className="k">Trust</span>
          <span className="v">{devices ? `${devices.trust}%` : "-"}</span>
          <span className="k">Depends on</span>
          <span className="v">
            {devices?.links.map((link) => findKnowledgeItem(link.target)?.label ?? link.target).join(", ") || "None"}
          </span>
        </div>
        <p className="subtle">Device groups (sensors, lights, cameras, assistants) appear here once devices are paired.</p>
      </div>
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  return <span className={`type-chip ${type.toLowerCase()}`}>{type}</span>;
}

function KnowsList() {
  const anchors = KNOWLEDGE_ITEMS.filter((item) => !item.parentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {anchors.map((item: KnowledgeItem) => {
        const expanded = expandedId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="knows-row"
              onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              aria-expanded={expanded}
            >
              <span className="name">{item.label}</span>
              <span className="meta">
                {item.learnedAt ? `updated ${item.learnedAt}` : ""} {expanded ? "︿" : "﹀"}
              </span>
            </button>
            {expanded && (
              <div className="summary-detail">
                <span className="k">Confidence</span>
                <span className="v">{item.confidence}%</span>
                <span className="k">Depends on</span>
                <span className="v">
                  {item.links.map((link) => findKnowledgeItem(link.target)?.label ?? link.target).join(", ") || "None"}
                </span>
                <span className="k">Source</span>
                <span className="v">{item.source ?? "Unknown"}</span>
                <span className="k">Status</span>
                <span className="v">{item.status ?? "Unknown"}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MemoryScreen({ events, rick: _rick }: SharedData) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const rows = MEMORY_ROWS.filter((row) => {
    if (filter !== "All" && row.category !== filter) return false;
    if (!search.trim()) return true;
    const haystack = `${row.entry} ${row.linked} ${row.source}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Memory</h1>
          <p className="page-sub">What Rick currently knows, in plain terms.</p>
        </div>
      </div>

      <div className="panel panel-pad">
        <p className="panel-title">Rick currently knows</p>
        <KnowsList />
      </div>

      <div className="panel panel-pad library-panel">
        <input
          placeholder="Search memory, or teach Rick a new skill..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
            <thead><tr><th>Entry</th><th>Type</th><th>Conf.</th><th>Updated</th><th>Source</th><th>Linked</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.entry} className={row.category === "Conflicts" ? "row-conflict" : undefined}>
                  <td>{row.entry}</td>
                  <td><TypeChip type={row.type} /></td>
                  <td>{row.confidence}</td>
                  <td>{row.updated}</td>
                  <td>{row.source}</td>
                  <td>{row.linked}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="empty-note">No entries match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DataStatusLine status={events} label="memory" />
    </div>
  );
}

function LogsScreen({ events }: SharedData) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-sub">Everything that&apos;s happened, chronologically.</p>
        </div>
      </div>
      <div className="panel panel-pad">
        <ActivityList events={events.data ?? []} status={events} />
      </div>
    </div>
  );
}

function SettingsScreen() {
  const settings = useApi<SettingsPayload>("/api/settings");
  const [topic, setTopic] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data && !dirty) setTopic(settings.data.ntfyTopic);
  }, [settings.data, dirty]);

  async function onSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ntfyTopic: topic })
      });
      settings.refetch();
      setDirty(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Deliberately small for now.</p>
        </div>
      </div>
      <div className="panel panel-pad">
        <p className="panel-title">Notifications</p>
        <p className="subtle" style={{ marginBottom: 10 }}>
          ntfy topic Uptime Kuma and Rick push alerts to. Set this up once ntfy is deployed - see its README.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="homelab-alerts-..."
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setDirty(true);
              setSaved(false);
            }}
            style={{ flex: 1, minHeight: 32 }}
          />
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving || !dirty}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {saved && <p className="subtle" style={{ marginTop: 8, color: "var(--good)" }}>Saved.</p>}
        <DataStatusLine status={settings} label="settings" />
      </div>
      <div className="panel panel-pad">
        <p className="panel-title">Appearance</p>
        <p className="subtle">Dark. This dashboard doesn&apos;t have a light theme yet.</p>
      </div>
    </div>
  );
}

// --- Assistant panel -----------------------------------------------------

const MODE_LABEL: Record<RickMode, string> = {
  observe: "Observe",
  diagnose: "Diagnose",
  plan: "Plan",
  teach: "Teach",
  "repair-proposal": "Repair Proposal",
  execute: "Execute"
};

type ConvoMessage = { from: "rick" | "me"; text: string };

const INITIAL_CONVO: ConvoMessage[] = [
  { from: "rick", text: "I've prepared the Home Assistant namespace plan. Nothing changes without your approval." },
  { from: "me", text: "what does it touch?" },
  { from: "rick", text: "Just a new namespace, network policy, and a secrets placeholder - no existing workloads." }
];

function replyFor(message: string, data: RickStatusPayload | null): string {
  const text = message.toLowerCase();
  if (text.includes("log")) return "Check the Logs page for the full activity feed.";
  if (text.includes("approv")) {
    const count = data?.approvalQueue.length ?? 0;
    return count > 0 ? `${count} item${count === 1 ? "" : "s"} pending your approval right now.` : "Nothing pending your approval right now.";
  }
  if (text.includes("status") || text.includes("health")) {
    return data ? `${data.disposition} Currently focused on ${data.focus}.` : "Still syncing status.";
  }
  return data ? `I'm in ${MODE_LABEL[data.mode]} mode. Nothing changes without your approval.` : "Still syncing.";
}

function AssistantPanel({ rick, onResolveApproval, onOpenPalette }: SharedData & { onOpenPalette: () => void }) {
  const data = rick.data;
  const [convo, setConvo] = useState<ConvoMessage[]>(INITIAL_CONVO);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setConvo((current) => [...current, { from: "me", text }, { from: "rick", text: replyFor(text, data) }]);
    setDraft("");
  }

  return (
    <aside className="assistant-panel">
      <div className="assistant-id">
        <h2 className="assistant-name">Rick</h2>
        <span className="assistant-online"><span className="status-dot good" />Online</span>
      </div>

      <div className="assistant-kv">
        <div>
          <span className="k">Disposition</span>
          <span className="v">{data?.disposition ?? "Calm, watchful, awaiting approval"}</span>
        </div>
        <div>
          <span className="k">Objective</span>
          <span className="v">{data?.focus ?? "Home Assistant rollout"}</span>
        </div>
        <div>
          <span className="k">Mode</span>
          <span className="v">{data ? MODE_LABEL[data.mode] : "Observe"}</span>
        </div>
      </div>

      <div className="trust-note">
        <span className="status-dot good" />Nothing changes without your approval
      </div>

      <div>
        <p className="section-label">Pending approvals</p>
        {rick.loading && !data ? (
          <span className="skeleton-line" style={{ width: 160 }} />
        ) : data && data.approvalQueue.length > 0 ? (
          <div className="approval-mini-list">
            {data.approvalQueue.map((item) => (
              <div className={`approval-mini approval-mini--${item.risk}`} key={item.id}>
                <div className="approval-mini-head">
                  <span className="approval-mini-title">{item.title}</span>
                  <span className={`approval-mini-risk ${item.risk}`}>{item.risk}</span>
                </div>
                <p className="approval-mini-desc">{item.description}</p>
                <div className="approval-mini-actions">
                  <button type="button" className="approve" onClick={() => onResolveApproval(item.id, "approve")}>Approve</button>
                  <button type="button" onClick={() => onResolveApproval(item.id, "dismiss")}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">Nothing pending.</p>
        )}
      </div>

      <div>
        <p className="section-label">Conversation</p>
        <div className="convo">
          {convo.map((message, index) => (
            <div className={`bubble ${message.from === "me" ? "me" : ""}`} key={index}>{message.text}</div>
          ))}
        </div>
      </div>

      <DataStatusLine status={rick} label="Rick" />

      <div className="assistant-input-row">
        <input
          placeholder="Message Rick..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
        />
        <button type="button" onClick={sendMessage}>Send</button>
        <button type="button" onClick={onOpenPalette} title="Command palette">⌘K</button>
      </div>
    </aside>
  );
}

// --- Root ------------------------------------------------------------------

export default function Home() {
  const [active, setActive] = useState<ScreenId>("overview");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const cluster = useApi<ClusterPayload>("/api/cluster");
  const argo = useApi<ArgoPayload>("/api/argocd");
  const monitoring = useApi<MonitoringPayload>("/api/monitoring");
  const ai = useApi<AiPayload>("/api/ai");
  const events = useApi<HomepageEvent[]>("/api/homepage/events");
  const applications = useApi<ApplicationsPayload>("/api/applications");
  const rick = useApi<RickStatusPayload>("/api/rick/status");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onResolveApproval(id: string, action: "approve" | "dismiss") {
    await patchRickStatus({ type: action, id });
    rick.refetch();
  }

  async function onRunPromptAction(action: PromptAction) {
    if (action.navigate) setActive(action.navigate);
    if (action.mode) {
      await patchRickStatus({ type: "set-mode", mode: action.mode });
      rick.refetch();
    }
    setPaletteOpen(false);
  }

  const shared: SharedData = { cluster, argo, monitoring, ai, events, applications, rick, onResolveApproval };

  return (
    <div className="app-shell">
      <Header onOpenPalette={() => setPaletteOpen(true)} />
      <Sidebar active={active} setActive={setActive} />
      <main className="content">
        {active === "overview" && <OverviewScreen {...shared} />}
        {active === "infrastructure" && <InfrastructureScreen {...shared} />}
        {active === "applications" && <ApplicationsScreen {...shared} />}
        {active === "automation" && <AutomationScreen {...shared} />}
        {active === "memory" && <MemoryScreen {...shared} />}
        {active === "logs" && <LogsScreen {...shared} />}
        {active === "settings" && <SettingsScreen />}
      </main>
      <AssistantPanel {...shared} onOpenPalette={() => setPaletteOpen(true)} />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onRun={onRunPromptAction} />}
    </div>
  );
}
