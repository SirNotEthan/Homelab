// What Rick knows - the knowledge graph behind the Infrastructure, Memory,
// and Automation pages. This used to also drive a 3D visualization; that's
// gone, but the underlying facts (confidence, trust, dependencies) are the
// same data, just shown as plain rows now instead of particles.

export type KnowledgeKind =
  | "skill"
  | "selfTaughtSkill"
  | "device"
  | "service"
  | "memory"
  | "tool"
  | "automation"
  | "document";

export type KnowledgeCluster =
  | "intelligence"
  | "homelab"
  | "devices"
  | "homeAutomation"
  | "observability"
  | "security"
  | "gitops"
  | "memory";

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

export type KnowledgeLink = { target: string; type: LinkType };

export type AccessLevel = "read" | "write" | "control" | "none";

export type KnowledgeItem = {
  id: string;
  label: string;
  kind: KnowledgeKind;
  cluster: KnowledgeCluster;
  /** 0-100. How well-established this knowledge is. */
  confidence: number;
  /** 0-100. How much Rick trusts this source/finding. */
  trust: number;
  /** What Rick can do to this system. */
  access: AccessLevel;
  /** Self-taught skills stay unconfirmed until you approve them. */
  approved?: boolean;
  /** id of the item this one is grouped under, e.g. a skill under "skills". */
  parentId?: string;
  learnedAt?: string;
  source?: string;
  hostedOn?: string;
  status?: string;
  links: KnowledgeLink[];
};

// Major systems - shown on Infrastructure/Automation and as the top-level
// "Rick currently knows" list on Memory.
const ANCHORS: KnowledgeItem[] = [
  {
    id: "reasoning",
    label: "Reasoning",
    kind: "service",
    cluster: "intelligence",
    confidence: 97,
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
    confidence: 92,
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
    confidence: 99,
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
    confidence: 94,
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
  },
  {
    id: "tools",
    label: "Tools",
    kind: "tool",
    cluster: "intelligence",
    confidence: 85,
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
    confidence: 91,
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
    confidence: 88,
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
    confidence: 96,
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
    confidence: 97,
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
    confidence: 95,
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
    confidence: 96,
    trust: 97,
    access: "read",
    learnedAt: "24h ago",
    source: "Authentik",
    status: "Online",
    links: [{ target: "kubernetes", type: "dependsOn" }]
  },
  {
    id: "devices",
    label: "Devices",
    kind: "device",
    cluster: "devices",
    confidence: 40,
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
    confidence: 35,
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
    confidence: 78,
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
    confidence: 88,
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
    confidence: 90,
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

// Individual taught / self-taught skills, grouped under the "skills" anchor.
const SKILLS: KnowledgeItem[] = [
  {
    id: "skill-cluster-status",
    label: "cluster-status",
    kind: "skill",
    cluster: "intelligence",
    parentId: "skills",
    confidence: 98,
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

// Individual remembered facts/preferences, grouped under whichever anchor
// they're most relevant to.
const MEMORIES: KnowledgeItem[] = [
  {
    id: "memory-prefers-argocd",
    label: "Prefers Argo CD over Flux",
    kind: "memory",
    cluster: "memory",
    parentId: "memory",
    confidence: 96,
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

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [...ANCHORS, ...SKILLS, ...MEMORIES];

export function findKnowledgeItem(id: string | null): KnowledgeItem | undefined {
  if (!id) return undefined;
  return KNOWLEDGE_ITEMS.find((item) => item.id === id);
}

export function childrenOf(id: string): KnowledgeItem[] {
  return KNOWLEDGE_ITEMS.filter((item) => item.parentId === id);
}
