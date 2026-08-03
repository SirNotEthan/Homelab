import type { SettingsPayload } from "../lib/api-types";

// In-memory mock store. Resets on server restart - real persistence (a
// Secret, a small config PVC, whatever) can replace this without changing
// the route's shape.
export const SETTINGS_STORE: SettingsPayload = {
  ntfyTopic: "",
  theme: "dark"
};
