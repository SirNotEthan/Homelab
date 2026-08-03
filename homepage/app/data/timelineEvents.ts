import type { HomepageEvent } from "../lib/api-types";

export const TIMELINE_EVENTS: HomepageEvent[] = [
  { id: "evt-1", time: "09:41", message: "Git commit pushed to homelab-infra", source: "git" },
  { id: "evt-2", time: "09:42", message: "Argo CD synced homepage", source: "argocd" },
  { id: "evt-3", time: "10:15", message: "Steward indexed roadmap", source: "steward" },
  { id: "evt-4", time: "10:20", message: "Ollama model pulled", source: "steward" },
  { id: "evt-5", time: "11:30", message: "Authentik health restored", source: "authentik" }
];
