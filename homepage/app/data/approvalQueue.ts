import type { RickStatusPayload } from "../lib/api-types";

// In-memory mock store. Resets on server restart - stands in for a real
// Rick state service (or a CRD/DB-backed store) once this route is wired
// to the live agent.
export const RICK_STATUS_STORE: RickStatusPayload = {
  disposition: "Calm, watchful, awaiting approval",
  focus: "Home Assistant rollout",
  mode: "observe",
  operatingMode: "Read-only, approval required",
  online: true,
  confidence: 93,
  recentActions: [
    { text: "Checked on cluster health", when: "2m ago" },
    { text: "Indexed latest roadmap notes", when: "18m ago" },
    { text: "Watched Ollama memory usage", when: "41m ago" },
    { text: "Proposed Home Assistant deployment", when: "1h ago" }
  ],
  approvalQueue: [
    {
      id: "appr-1",
      title: "Restart Ollama deployment",
      description: "Clears a memory leak observed over the last 6 hours.",
      rationale: "AI node memory has climbed steadily since the last restart 6h ago with no matching increase in load - consistent with a leak, not real usage.",
      requestedAt: "12m ago",
      risk: "low"
    },
    {
      id: "appr-2",
      title: "Apply Home Assistant namespace",
      description: "Creates the namespace, network policy, and sealed secrets placeholder.",
      rationale: "You approved the Home Assistant rollout plan; this is the first infrastructure step and touches no existing workloads.",
      requestedAt: "1h ago",
      risk: "medium"
    },
    {
      id: "appr-3",
      title: "Increase AI memory quota",
      description: "Raises the ai-runtime namespace memory limit from 16Gi to 24Gi.",
      rationale: "Ollama has hit its memory ceiling twice this week while loading larger models, throttling response time.",
      requestedAt: "3h ago",
      risk: "medium"
    },
    {
      id: "appr-4",
      title: "Update roadmap from latest changes",
      description: "Rewrites roadmap.md sections touched by the last 5 commits.",
      rationale: "Roadmap.md is a tracked memory source; keeping it in sync with recent commits improves future planning accuracy.",
      requestedAt: "1d ago",
      risk: "low"
    }
  ]
};
