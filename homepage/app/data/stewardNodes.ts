// Steward Core data model - every particle in the 3D scene comes from here.
// This is the single source of truth for both the visual core (StewardCore.tsx)
// and the dashboard context panels (page.tsx) that key off the same ids.

export type ParticleKind =
  | "core"
  | "skill"
  | "selfTaughtSkill"
  | "device"
  | "service"
  | "memory"
  | "tool"
  | "automation"
  | "alert"
  | "document";

export type ParticleCluster =
  | "intelligence"
  | "homelab"
  | "devices"
  | "homeAutomation"
  | "observability"
  | "security"
  | "gitops"
  | "memory";

export type OrbitBand = "inner" | "middle" | "outer" | "satellite";

export type LinkType = "observes" | "controls" | "dependsOn" | "learnedFrom" | "securedBy" | "runsOn" | "backedUpBy";

export const LINK_TYPE_LABEL: Record<LinkType, string> = {
  observes: "observes",
  controls: "controls",
  dependsOn: "depends on",
  learnedFrom: "learned from",
  securedBy: "secured by",
  runsOn: "runs on",
  backedUpBy: "backed up by"
};

export type ParticleLink = { target: string; type: LinkType };

export type AccessLevel = "read" | "write" | "control" | "none";

export type StewardParticle = {
  id: string;
  label: string;
  kind: ParticleKind;
  cluster: ParticleCluster;
  orbit: OrbitBand;
  /** id of the anchor particle this one orbits, for satellite-tier particles. */
  parentId?: string;
  /** 0-100. Drives node size - how well-established this knowledge is. */
  confidence: number;
  /** 0-100. Drives brightness - how actively Steward is using/watching this. */
  activation: number;
  /** 0-100. Drives motion regularity - low stability flickers/drifts. */
  stability: number;
  /** 0-100. Drives pulse speed - how much is happening here right now. */
  energy: number;
  /** 0-100. Drives color saturation - low trust reads dim/faint. */
  trust: number;
  /** What Steward can do to this system. Shown in the inspector. */
  access: AccessLevel;
  /** Self-taught skills stay unconfirmed (shimmering) until you approve them. */
  approved?: boolean;
  learnedAt?: string;
  source?: string;
  hostedOn?: string;
  status?: string;
  links: ParticleLink[];
  position: [number, number, number];
  size: number;
};

type OrbitSpec = { radius: number; tilt: number; yJitter: number; flatten: number };

const ORBIT_SPEC: Record<Exclude<OrbitBand, "satellite">, OrbitSpec> = {
  inner: { radius: 1.25, tilt: 0.6, yJitter: 0.22, flatten: 0.55 },
  middle: { radius: 2.05, tilt: 1.4, yJitter: 0.42, flatten: 0.62 },
  outer: { radius: 2.95, tilt: 2.3, yJitter: 0.55, flatten: 0.68 }
};

function ringPosition(
  index: number,
  count: number,
  orbit: Exclude<OrbitBand, "satellite">,
  confidence: number,
  activation: number
): [number, number, number] {
  const spec = ORBIT_SPEC[orbit];
  const angle = (index / count) * Math.PI * 2 + spec.tilt;
  // Low-confidence knowledge drifts outward; high-activation knowledge sits
  // closer to the core - radius is a function of what Steward knows, not
  // a fixed ring.
  const radius = spec.radius * (1 + ((100 - confidence) / 100) * 0.15) * (1 - (activation / 100) * 0.12);
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle) * spec.flatten;
  const y = Math.sin(angle * 2 + spec.tilt) * spec.yJitter;
  return [x, y, z];
}

/** Positions a small satellite particle in a loose halo around its parent anchor. */
function satellitePosition(parentPosition: [number, number, number], index: number, count: number, confidence: number): [number, number, number] {
  const localRadius = 0.28 + ((100 - confidence) / 100) * 0.18;
  const angle = (index / count) * Math.PI * 2 + index * 0.7;
  const tilt = (index % 3) * 0.6;
  const x = parentPosition[0] + localRadius * Math.cos(angle);
  const y = parentPosition[1] + Math.sin(angle * 1.7 + tilt) * localRadius * 0.5;
  const z = parentPosition[2] + localRadius * Math.sin(angle);
  return [x, y, z];
}

type ParticleSeed = Omit<StewardParticle, "position" | "size" | "links" | "orbit"> & {
  links: ParticleLink[];
};

const INNER: (ParticleSeed & { orbit: "inner" })[] = [
  {
    id: "reasoning",
    label: "Reasoning",
    kind: "service",
    cluster: "intelligence",
    orbit: "inner",
    confidence: 97,
    activation: 88,
    stability: 90,
    energy: 70,
    trust: 95,
    access: "control",
    learnedAt: "continuous",
    source: "Active inference loop",
    status: "Active",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "context", type: "dependsOn" },
      { target: "skills", type: "dependsOn" }
    ]
  },
  {
    id: "memory",
    label: "Memory",
    kind: "memory",
    cluster: "memory",
    orbit: "inner",
    confidence: 92,
    activation: 75,
    stability: 92,
    energy: 40,
    trust: 96,
    access: "write",
    learnedAt: "10m ago",
    source: "roadmap.md, conversations",
    status: "Indexed",
    links: [
      { target: "reasoning", type: "dependsOn" },
      { target: "personal-knowledge", type: "dependsOn" },
      { target: "documents", type: "dependsOn" }
    ]
  },
  {
    id: "context",
    label: "Current Context",
    kind: "service",
    cluster: "intelligence",
    orbit: "inner",
    confidence: 99,
    activation: 95,
    stability: 80,
    energy: 85,
    trust: 90,
    access: "read",
    learnedAt: "just now",
    source: "Home Assistant rollout",
    status: "Active reasoning",
    links: [
      { target: "reasoning", type: "dependsOn" },
      { target: "memory", type: "dependsOn" }
    ]
  },
  {
    id: "skills",
    label: "Skills",
    kind: "skill",
    cluster: "intelligence",
    orbit: "inner",
    confidence: 94,
    activation: 70,
    stability: 85,
    energy: 55,
    trust: 88,
    access: "control",
    learnedAt: "18m ago",
    source: "Taught + self-learned",
    status: "5 taught, 3 self-taught",
    links: [
      { target: "memory", type: "learnedFrom" },
      { target: "gitops", type: "runsOn" },
      { target: "kubernetes", type: "runsOn" }
    ]
  }
];

const MIDDLE: (ParticleSeed & { orbit: "middle" })[] = [
  {
    id: "tools",
    label: "Tools",
    kind: "tool",
    cluster: "intelligence",
    orbit: "middle",
    confidence: 85,
    activation: 60,
    stability: 88,
    energy: 30,
    trust: 90,
    access: "control",
    learnedAt: "1mo ago",
    source: "Granted by you",
    status: "4 granted",
    links: [
      { target: "kubernetes", type: "controls" },
      { target: "gitops", type: "controls" }
    ]
  },
  {
    id: "models",
    label: "Models",
    kind: "service",
    cluster: "intelligence",
    orbit: "middle",
    confidence: 91,
    activation: 82,
    stability: 78,
    energy: 65,
    trust: 85,
    access: "control",
    learnedAt: "6m ago",
    source: "Ollama runtime",
    hostedOn: "ai-node-01",
    status: "qwen2.5-coder:1.5b active",
    links: [
      { target: "kubernetes", type: "runsOn" },
      { target: "observability", type: "dependsOn" },
      { target: "search", type: "dependsOn" }
    ]
  },
  {
    id: "search",
    label: "Search",
    kind: "service",
    cluster: "intelligence",
    orbit: "middle",
    confidence: 88,
    activation: 55,
    stability: 82,
    energy: 35,
    trust: 80,
    access: "read",
    learnedAt: "10m ago",
    source: "SearXNG",
    status: "Connected",
    links: [
      { target: "models", type: "dependsOn" },
      { target: "documents", type: "observes" }
    ]
  },
  {
    id: "gitops",
    label: "GitOps",
    kind: "service",
    cluster: "gitops",
    orbit: "middle",
    confidence: 96,
    activation: 78,
    stability: 90,
    energy: 45,
    trust: 92,
    access: "write",
    learnedAt: "4m ago",
    source: "Argo CD",
    status: "Fully synced",
    links: [
      { target: "kubernetes", type: "runsOn" },
      { target: "recovery", type: "backedUpBy" }
    ]
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    kind: "service",
    cluster: "homelab",
    orbit: "middle",
    confidence: 97,
    activation: 85,
    stability: 93,
    energy: 50,
    trust: 95,
    access: "control",
    learnedAt: "2m ago",
    source: "Cluster API",
    status: "4/4 nodes ready",
    links: [
      { target: "identity", type: "securedBy" },
      { target: "recovery", type: "backedUpBy" }
    ]
  },
  {
    id: "observability",
    label: "Observability",
    kind: "service",
    cluster: "observability",
    orbit: "middle",
    confidence: 95,
    activation: 72,
    stability: 88,
    energy: 40,
    trust: 90,
    access: "read",
    learnedAt: "1m ago",
    source: "Prometheus, Loki, Grafana",
    status: "All healthy",
    links: [
      { target: "kubernetes", type: "observes" },
      { target: "gitops", type: "observes" },
      { target: "identity", type: "observes" }
    ]
  },
  {
    id: "identity",
    label: "Identity",
    kind: "service",
    cluster: "security",
    orbit: "middle",
    confidence: 96,
    activation: 68,
    stability: 95,
    energy: 25,
    trust: 97,
    access: "read",
    learnedAt: "24h ago",
    source: "Authentik",
    status: "Online",
    links: [{ target: "kubernetes", type: "dependsOn" }]
  }
];

const OUTER: (ParticleSeed & { orbit: "outer" })[] = [
  {
    id: "devices",
    label: "Devices",
    kind: "device",
    cluster: "devices",
    orbit: "outer",
    confidence: 40,
    activation: 20,
    stability: 60,
    energy: 15,
    trust: 55,
    access: "none",
    learnedAt: "not yet paired",
    source: "Device registry",
    status: "0 paired",
    links: [{ target: "home-automation", type: "dependsOn" }]
  },
  {
    id: "home-automation",
    label: "Home Automation",
    kind: "automation",
    cluster: "homeAutomation",
    orbit: "outer",
    confidence: 35,
    activation: 15,
    stability: 45,
    energy: 20,
    trust: 50,
    access: "none",
    learnedAt: "planned",
    source: "Deployment plan",
    status: "Pending deploy",
    links: [
      { target: "devices", type: "controls" },
      { target: "kubernetes", type: "runsOn" }
    ]
  },
  {
    id: "documents",
    label: "Documents",
    kind: "document",
    cluster: "memory",
    orbit: "outer",
    confidence: 78,
    activation: 40,
    stability: 85,
    energy: 20,
    trust: 82,
    access: "read",
    learnedAt: "10m ago",
    source: "roadmap.md, config scans",
    status: "Indexed",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "personal-knowledge", type: "dependsOn" }
    ]
  },
  {
    id: "recovery",
    label: "Recovery",
    kind: "service",
    cluster: "homelab",
    orbit: "outer",
    confidence: 88,
    activation: 30,
    stability: 90,
    energy: 15,
    trust: 90,
    access: "read",
    learnedAt: "10:20",
    source: "Longhorn, backup jobs",
    status: "Healthy",
    links: [
      { target: "kubernetes", type: "dependsOn" },
      { target: "gitops", type: "dependsOn" }
    ]
  },
  {
    id: "personal-knowledge",
    label: "Personal Knowledge",
    kind: "memory",
    cluster: "memory",
    orbit: "outer",
    confidence: 90,
    activation: 45,
    stability: 88,
    energy: 25,
    trust: 85,
    access: "write",
    learnedAt: "1w ago",
    source: "Conversations, config scans",
    status: "96-98% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "documents", type: "dependsOn" }
    ]
  }
];

type SatelliteSeed = Omit<StewardParticle, "position" | "size" | "orbit"> & { parentId: string };

// Every taught and self-taught skill gets its own particle in a "Skill
// Lattice" orbiting the Skills anchor. Self-taught ones stay unapproved
// (shimmering) until you confirm them.
const SKILL_SATELLITES: SatelliteSeed[] = [
  {
    id: "skill-cluster-status",
    label: "cluster-status",
    kind: "skill",
    cluster: "intelligence",
    parentId: "skills",
    confidence: 98,
    activation: 60,
    stability: 90,
    energy: 30,
    trust: 92,
    access: "read",
    approved: true,
    learnedAt: "taught by you",
    source: "Taught procedure",
    status: "98% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "kubernetes", type: "observes" }
    ]
  },
  {
    id: "skill-gitops-application",
    label: "gitops-application",
    kind: "skill",
    cluster: "gitops",
    parentId: "skills",
    confidence: 94,
    activation: 55,
    stability: 88,
    energy: 28,
    trust: 90,
    access: "write",
    approved: true,
    learnedAt: "taught by you",
    source: "Taught procedure",
    status: "94% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "gitops", type: "observes" }
    ]
  },
  {
    id: "skill-repo-change",
    label: "repo-change",
    kind: "skill",
    cluster: "gitops",
    parentId: "skills",
    confidence: 91,
    activation: 45,
    stability: 86,
    energy: 25,
    trust: 88,
    access: "write",
    approved: true,
    learnedAt: "taught by you",
    source: "Taught procedure",
    status: "91% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "gitops", type: "dependsOn" }
    ]
  },
  {
    id: "skill-node-scaling",
    label: "node-scaling",
    kind: "skill",
    cluster: "homelab",
    parentId: "skills",
    confidence: 93,
    activation: 40,
    stability: 89,
    energy: 22,
    trust: 90,
    access: "control",
    approved: true,
    learnedAt: "taught by you",
    source: "Taught procedure",
    status: "93% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "kubernetes", type: "controls" }
    ]
  },
  {
    id: "skill-repair-longhorn-replica",
    label: "repair-longhorn-replica",
    kind: "skill",
    cluster: "homelab",
    parentId: "skills",
    confidence: 88,
    activation: 20,
    stability: 90,
    energy: 15,
    trust: 90,
    access: "write",
    approved: true,
    learnedAt: "3w ago",
    source: "Taught procedure",
    status: "88% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "recovery", type: "dependsOn" }
    ]
  },
  {
    id: "skill-log-correlation",
    label: "log-correlation",
    kind: "selfTaughtSkill",
    cluster: "observability",
    parentId: "skills",
    confidence: 71,
    activation: 50,
    stability: 38,
    energy: 55,
    trust: 62,
    access: "read",
    approved: false,
    learnedAt: "18m ago",
    source: "Self-taught - observed pattern",
    status: "Awaiting your approval",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "observability", type: "learnedFrom" }
    ]
  },
  {
    id: "skill-backup-target-inference",
    label: "backup-target-inference",
    kind: "selfTaughtSkill",
    cluster: "homelab",
    parentId: "skills",
    confidence: 58,
    activation: 35,
    stability: 30,
    energy: 45,
    trust: 48,
    access: "none",
    approved: false,
    learnedAt: "4d ago",
    source: "Self-taught - conflicting notes",
    status: "Low confidence, awaiting approval",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "recovery", type: "learnedFrom" }
    ]
  },
  {
    id: "skill-commit-message-style",
    label: "commit-message-style",
    kind: "selfTaughtSkill",
    cluster: "gitops",
    parentId: "skills",
    confidence: 82,
    activation: 30,
    stability: 42,
    energy: 40,
    trust: 68,
    access: "none",
    approved: false,
    learnedAt: "3d ago",
    source: "Self-taught - conversation pattern",
    status: "Awaiting your approval",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "gitops", type: "learnedFrom" }
    ]
  }
];

// Every remembered fact/preference gets its own small particle, denser and
// closer to whichever anchor it's most relevant to.
const MEMORY_SATELLITES: SatelliteSeed[] = [
  {
    id: "memory-prefers-argocd",
    label: "Prefers Argo CD over Flux",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 96,
    activation: 30,
    stability: 90,
    energy: 15,
    trust: 92,
    access: "read",
    learnedAt: "2d ago",
    source: "Conversation",
    status: "96% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "gitops", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-concise-commits",
    label: "Prefers concise commit messages",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 90,
    activation: 20,
    stability: 88,
    energy: 12,
    trust: 88,
    access: "read",
    learnedAt: "3d ago",
    source: "Conversation",
    status: "90% confidence",
    links: [{ target: "memory", type: "dependsOn" }]
  },
  {
    id: "memory-network-topology",
    label: "Home network topology",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 98,
    activation: 25,
    stability: 92,
    energy: 10,
    trust: 94,
    access: "read",
    learnedAt: "1w ago",
    source: "Config scan",
    status: "98% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "kubernetes", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-cluster-topology",
    label: "4-node cluster topology",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 99,
    activation: 30,
    stability: 93,
    energy: 12,
    trust: 95,
    access: "read",
    learnedAt: "1w ago",
    source: "Config scan",
    status: "99% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "kubernetes", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-argocd-trust",
    label: "Argo CD API trusted read-only",
    kind: "memory",
    cluster: "memory",
    parentId: "tools",
    confidence: 100,
    activation: 35,
    stability: 95,
    energy: 10,
    trust: 98,
    access: "read",
    learnedAt: "1mo ago",
    source: "Granted by you",
    status: "100% confidence",
    links: [
      { target: "tools", type: "dependsOn" },
      { target: "gitops", type: "controls" }
    ]
  },
  {
    id: "memory-kubernetes-trust",
    label: "Kubernetes API trusted read/write",
    kind: "memory",
    cluster: "memory",
    parentId: "tools",
    confidence: 100,
    activation: 40,
    stability: 95,
    energy: 12,
    trust: 98,
    access: "write",
    learnedAt: "1mo ago",
    source: "Granted by you",
    status: "100% confidence",
    links: [
      { target: "tools", type: "dependsOn" },
      { target: "kubernetes", type: "controls" }
    ]
  },
  {
    id: "memory-prometheus-runbook",
    label: "Repair: Prometheus disk pressure",
    kind: "memory",
    cluster: "memory",
    parentId: "skills",
    confidence: 91,
    activation: 20,
    stability: 87,
    energy: 15,
    trust: 88,
    access: "read",
    learnedAt: "5h ago",
    source: "Runbook",
    status: "91% confidence",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "observability", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-node-labels",
    label: "Learned new node labels",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 94,
    activation: 55,
    stability: 82,
    energy: 30,
    trust: 90,
    access: "read",
    learnedAt: "18m ago",
    source: "Cluster scan",
    status: "94% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "kubernetes", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-loki-correlation",
    label: "Correlated Loki logs with alerts",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 87,
    activation: 50,
    stability: 78,
    energy: 32,
    trust: 82,
    access: "read",
    learnedAt: "18m ago",
    source: "Observed pattern",
    status: "87% confidence",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "observability", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-backup-target-conflict",
    label: "Unsure which node is the backup target",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 52,
    activation: 30,
    stability: 25,
    energy: 40,
    trust: 45,
    access: "read",
    learnedAt: "4d ago",
    source: "Conflicting notes",
    status: "52% confidence - conflicting",
    links: [
      { target: "memory", type: "dependsOn" },
      { target: "recovery", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-node-scaling-drift",
    label: "node-scaling needs retraining",
    kind: "memory",
    cluster: "memory",
    parentId: "skills",
    confidence: 63,
    activation: 25,
    stability: 40,
    energy: 30,
    trust: 55,
    access: "read",
    learnedAt: "6d ago",
    source: "Version drift",
    status: "63% confidence - pending",
    links: [
      { target: "skills", type: "dependsOn" },
      { target: "kubernetes", type: "learnedFrom" }
    ]
  },
  {
    id: "memory-home-assistant-plan",
    label: "Deploy Home Assistant via Helm",
    kind: "memory",
    cluster: "memory",
    parentId: "home-automation",
    confidence: 41,
    activation: 20,
    stability: 35,
    energy: 20,
    trust: 45,
    access: "read",
    learnedAt: "2d ago",
    source: "Planning doc",
    status: "41% confidence - pending",
    links: [
      { target: "home-automation", type: "dependsOn" },
      { target: "memory", type: "dependsOn" }
    ]
  }
];

function withLayout(seeds: (ParticleSeed & { orbit: Exclude<OrbitBand, "satellite"> })[], sizeRange: [number, number]): StewardParticle[] {
  return seeds.map((seed, index) => ({
    ...seed,
    position: ringPosition(index, seeds.length, seed.orbit, seed.confidence, seed.activation),
    size: sizeRange[0] + (seed.confidence / 100) * (sizeRange[1] - sizeRange[0])
  }));
}

function withSatelliteLayout(seeds: SatelliteSeed[], anchors: StewardParticle[], sizeRange: [number, number]): StewardParticle[] {
  const byParent = new Map<string, SatelliteSeed[]>();
  seeds.forEach((seed) => {
    const list = byParent.get(seed.parentId) ?? [];
    list.push(seed);
    byParent.set(seed.parentId, list);
  });

  return seeds.map((seed) => {
    const anchor = anchors.find((particle) => particle.id === seed.parentId);
    const siblings = byParent.get(seed.parentId) ?? [seed];
    const index = siblings.indexOf(seed);
    const parentPosition: [number, number, number] = anchor?.position ?? [0, 0, 0];

    return {
      ...seed,
      orbit: "satellite" as const,
      position: satellitePosition(parentPosition, index, siblings.length, seed.confidence),
      size: sizeRange[0] + (seed.confidence / 100) * (sizeRange[1] - sizeRange[0])
    };
  });
}

const ANCHORS: StewardParticle[] = [
  ...withLayout(INNER, [0.1, 0.14]),
  ...withLayout(MIDDLE, [0.08, 0.12]),
  ...withLayout(OUTER, [0.07, 0.1])
];

export const STEWARD_PARTICLES: StewardParticle[] = [
  ...ANCHORS,
  ...withSatelliteLayout(SKILL_SATELLITES, ANCHORS, [0.035, 0.055]),
  ...withSatelliteLayout(MEMORY_SATELLITES, ANCHORS, [0.025, 0.045])
];

export const DEFAULT_FOCUS_PARTICLE_ID = "home-automation";

export function findParticle(id: string | null): StewardParticle | undefined {
  if (!id) return undefined;
  return STEWARD_PARTICLES.find((particle) => particle.id === id);
}
