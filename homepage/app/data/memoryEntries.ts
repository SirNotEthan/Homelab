export type MemoryRow = {
  entry: string;
  type: string;
  confidence: string;
  updated: string;
  source: string;
  linked: string;
  category: string;
  /** id of the matching particle in stewardNodes.ts, for "View in Core". */
  particleId: string;
};

export const MEMORY_ROWS: MemoryRow[] = [
  { entry: "Prefers Argo CD over Flux for GitOps", type: "Memory", confidence: "96%", updated: "2d ago", source: "Conversation", linked: "Kubernetes, GitOps", category: "Preferences", particleId: "memory-prefers-argocd" },
  { entry: "Prefers concise commit messages", type: "Memory", confidence: "90%", updated: "3d ago", source: "Conversation", linked: "Workflow", category: "Preferences", particleId: "memory-concise-commits" },
  { entry: "Home network topology", type: "Memory", confidence: "98%", updated: "1w ago", source: "Config scan", linked: "Homelab", category: "Facts", particleId: "memory-network-topology" },
  { entry: "4-node cluster, lab-01 through lab-04", type: "Memory", confidence: "99%", updated: "1w ago", source: "Config scan", linked: "Kubernetes", category: "Facts", particleId: "memory-cluster-topology" },
  { entry: "Argo CD API is trusted read-only", type: "Tool", confidence: "100%", updated: "1mo ago", source: "Granted by you", linked: "GitOps", category: "Tools", particleId: "memory-argocd-trust" },
  { entry: "Kubernetes API trusted read/write", type: "Tool", confidence: "100%", updated: "1mo ago", source: "Granted by you", linked: "Kubernetes", category: "Tools", particleId: "memory-kubernetes-trust" },
  { entry: "Repair proposal: Prometheus disk pressure", type: "Skill", confidence: "91%", updated: "5h ago", source: "Runbook", linked: "Monitoring, Recovery", category: "Runbooks", particleId: "memory-prometheus-runbook" },
  { entry: "Rebuild Longhorn replica after node loss", type: "Skill", confidence: "88%", updated: "3w ago", source: "Taught procedure", linked: "Kubernetes, Recovery", category: "Runbooks", particleId: "skill-repair-longhorn-replica" },
  { entry: "Learned new node labels", type: "Memory", confidence: "94%", updated: "18m ago", source: "Cluster scan", linked: "Kubernetes", category: "Recent", particleId: "memory-node-labels" },
  { entry: "Correlated Loki logs with alerts", type: "Skill", confidence: "87%", updated: "18m ago", source: "Observed pattern", linked: "Monitoring", category: "Recent", particleId: "memory-loki-correlation" },
  { entry: "Unsure whether lab-03 or lab-04 is the backup target", type: "Memory", confidence: "52%", updated: "4d ago", source: "Conflicting notes", linked: "Recovery", category: "Conflicts", particleId: "memory-backup-target-conflict" },
  { entry: "node-scaling skill needs retraining after v1.31 upgrade", type: "Skill", confidence: "63%", updated: "6d ago", source: "Version drift", linked: "Kubernetes", category: "Pending", particleId: "memory-node-scaling-drift" },
  { entry: "Deploy Home Assistant via Helm", type: "Skill", confidence: "41%", updated: "2d ago", source: "Planning doc", linked: "Home Automation", category: "Pending", particleId: "memory-home-assistant-plan" }
];

export const MEMORY_FILTERS = ["All", "Preferences", "Facts", "Tools", "Runbooks", "Recent", "Conflicts", "Pending"];
