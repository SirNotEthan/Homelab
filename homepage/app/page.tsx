"use client";

import { useState } from "react";
import StewardCore from "./components/StewardCore";

const navItems = [
  ["overview", "Overview"],
  ["ai-core", "AI Core"],
  ["infrastructure", "Infra"],
  ["applications", "Apps"],
  ["home", "Home"],
  ["gitops", "GitOps"],
  ["memory", "Memory"]
] as const;

const timeline = [
  ["09:41", "Git commit pushed to homelab-infra"],
  ["09:42", "Argo CD synced homepage"],
  ["10:15", "Steward memory updated"],
  ["10:20", "Backup job completed"],
  ["11:30", "Notice: high memory auto-resolved"]
];

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
        <span className="chip" style={{ background: "#bffbff", color: "#031018" }}>S</span>
      </div>
    </header>
  );
}

function Sidebar({ active, setActive }: { active: string; setActive: (screen: string) => void }) {
  return (
    <nav className="sidebar">
      {navItems.map(([id, label]) => (
        <button
          key={id}
          className={`nav-item ${active === id ? "active" : ""}`}
          onClick={() => setActive(id)}
          type="button"
        >
          <span className="nav-icon" />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function StewardPanel() {
  return (
    <aside className="assistant-panel">
      <div>
        <h2 className="steward-name">Steward</h2>
        <div className="subtle">Private AI command center</div>
        <p className="subtle">Disposition - Calm, watchful, awaiting approval</p>
        <p className="subtle">Current focus - Home Assistant rollout</p>
        <p className="subtle">Operating mode - Read-only, approval required</p>
      </div>
      <div className="notice">
        <strong>Read-only - Awaiting your approval</strong>
        <br />
        Shall I apply the Home Assistant deployment plan?
        <br />
        <u>Review</u>
      </div>
      <div className="actions">
        <button type="button">Ask</button>
        <button type="button">Diagnose</button>
        <button type="button">Plan</button>
        <button type="button">Repair Proposal</button>
        <button className="wide" type="button">Teach Skill</button>
      </div>
      <div>
        <h3 className="card-title">Recent actions</h3>
        <p className="subtle">Checked on cluster health - 2m ago</p>
        <p className="subtle">Indexed latest roadmap notes - 18m ago</p>
        <p className="subtle">Watched Ollama memory usage - 41m ago</p>
        <p className="subtle">Proposed Home Assistant deployment - 1h ago</p>
      </div>
      <div className="message">
        I have prepared the plan, sir. Nothing will be changed without your approval.
      </div>
      <div className="input-row">
        <input placeholder="Message Steward..." />
        <button className="send" type="button">Send</button>
      </div>
    </aside>
  );
}

function CorePanel({ detail = false }: { detail?: boolean }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h1 className="panel-title">
          {detail ? "AI Core Detail - inside Steward's mind" : "Steward - Intelligence Core"}
        </h1>
        <div className="subtle">
          {detail
            ? "memory, reasoning, tools and trust, all at once"
            : "a living orbital map of what Steward knows, trusts, and is reasoning about"}
        </div>
        <div className="chip" style={{ marginTop: 8 }}>
          <span className="dot" />Active reasoning - Home Assistant rollout
        </div>
      </div>
      <div className="legend">
        <span><span className="dot" style={{ color: "var(--cyan-soft)" }} /> Cognitive</span>
        <span><span className="dot" style={{ color: "var(--teal)" }} /> Operational</span>
        <span><span className="dot" style={{ color: "var(--cyan)" }} /> Peripheral</span>
      </div>
      <div className="core-wrap">
        <StewardCore detail={detail} />
      </div>
      <div className="inspector">
        <h3>Selected - Memory Ring</h3>
        <div className="kv">
          <span>Confidence</span><b>92%</b>
          <span>Last learned</span><b>10 min ago</b>
          <span>Sources</span><b>roadmap.md, Argo events</b>
          <span>Linked skills</span><b>cluster-status, gitops</b>
          <span>Trust</span><b>High</b>
        </div>
      </div>
    </section>
  );
}

function StatusCards() {
  return (
    <div className="cards">
      <article className="card">
        <span className="status">Healthy</span>
        <h3 className="card-title">Kubernetes Cluster</h3>
        <p>4/4 nodes ready</p>
        <div className="bar"><span style={{ width: "42%" }} /></div>
        <p>CPU 42%</p>
        <div className="bar"><span style={{ width: "61%" }} /></div>
        <p>Memory 61%</p>
        <p>Argo CD synced - 8f3a1c2</p>
      </article>
      <article className="card">
        <span className="status">Running</span>
        <h3 className="card-title">AI Runtime</h3>
        <p>Ollama active</p>
        <p>qwen2.5-coder loaded</p>
        <p>3 models installed</p>
        <p>Search connected</p>
      </article>
      <article className="card">
        <span className="status">Healthy</span>
        <h3 className="card-title">Observability</h3>
        <p>Grafana healthy</p>
        <p>Prometheus - 214 targets</p>
        <p>Loki - 1.2M lines/min</p>
        <p>Last alert auto-resolved</p>
      </article>
      <article className="card">
        <span className="status">Secure</span>
        <h3 className="card-title">Security / Identity</h3>
        <p>Authentik online</p>
        <p>Sealed Secrets healthy</p>
        <p>cert-manager - 12 certs valid</p>
      </article>
      <article className="card">
        <span className="status">Planned</span>
        <h3 className="card-title">Home Automation</h3>
        <p>Home Assistant pending deploy</p>
        <p>0 devices paired yet</p>
        <p>Rollout targeted Q3 2026</p>
      </article>
    </div>
  );
}

function Timeline() {
  return (
    <div className="timeline">
      {timeline.map(([time, event]) => (
        <div className="timeline-card" key={`${time}-${event}`}>
          <span style={{ color: "var(--cyan)" }}>{time}</span>
          <br />
          {event}
        </div>
      ))}
    </div>
  );
}

function OverviewScreen() {
  return (
    <section className="screen">
      <CorePanel />
      <StatusCards />
      <Timeline />
    </section>
  );
}

function AiCoreScreen() {
  return (
    <section className="screen ai-core">
      <CorePanel detail />
      <div className="detail-grid">
        <article className="card"><h3 className="card-title">Skill library</h3><p>cluster-status - 98%</p><p>gitops-application - 94%</p><p>repo-change - 91%</p><p>node-scaling - 93%</p></article>
        <article className="card"><h3 className="card-title">Tool permissions</h3><p>Kubernetes API - read/write</p><p>Argo CD API - read-only</p><p>Shell - approved</p><p>Home Assistant - not yet granted</p></article>
        <article className="card"><h3 className="card-title">Recently learned</h3><p>Learned new node labels</p><p>Indexed roadmap changes</p><p>Correlated Loki logs with alerts</p></article>
        <article className="card"><h3 className="card-title">Approval queue</h3><p>Apply Home Assistant deployment plan</p><p>Restart kubelet on lab-03</p></article>
        <article className="card"><h3 className="card-title">Memory sources</h3><p>roadmap.md</p><p>model-registry.yaml</p><p>Argo CD events</p><p>Prometheus + Loki</p></article>
        <article className="card"><h3 className="card-title">Confidence & trust</h3><p>Current Context - 99%</p><div className="bar"><span style={{ width: "99%" }} /></div><p>Reasoning - 97%</p><div className="bar"><span style={{ width: "97%" }} /></div></article>
      </div>
      <Timeline />
    </section>
  );
}

function MemoryScreen() {
  const rows = [
    ["Prefers Argo CD over Flux for GitOps", "Memory", "96%", "2d ago", "Conversation", "Kubernetes, GitOps"],
    ["Repair proposal: Prometheus disk pressure", "Skill", "91%", "5h ago", "Runbook", "Monitoring, Recovery"],
    ["Home network topology", "Memory", "98%", "1w ago", "Config scan", "Homelab"],
    ["Deploy Home Assistant via Helm", "Skill", "41%", "2d ago", "Planning doc", "Home Automation"],
    ["Rebuild Longhorn replica after node loss", "Skill", "88%", "3w ago", "Taught procedure", "Kubernetes, Recovery"]
  ];

  return (
    <section className="screen memory">
      <div className="panel library-panel">
        <div className="input-row">
          <input placeholder="Teach Steward a new skill, or correct a memory..." />
          <button className="teach" type="button">Teach</button>
        </div>
        <div className="filters">
          {["All", "Memory", "Skill", "Tool", "Pending Review", "Low Confidence"].map((filter, index) => (
            <span className={`filter ${index === 0 ? "active" : ""}`} key={filter}>{filter}</span>
          ))}
        </div>
        <table className="table">
          <thead><tr><th>Entry</th><th>Type</th><th>Conf.</th><th>Updated</th><th>Source</th><th>Linked</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={cell} style={index === 1 ? { color: "var(--cyan)" } : undefined}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Timeline />
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState("overview");

  return (
    <div className="app-shell">
      <Header />
      <Sidebar active={active} setActive={setActive} />
      <main className="content">
        {active === "overview" && <OverviewScreen />}
        {active === "ai-core" && <AiCoreScreen />}
        {active === "memory" && <MemoryScreen />}
        {!["overview", "ai-core", "memory"].includes(active) && <OverviewScreen />}
      </main>
      <StewardPanel />
    </div>
  );
}
