import type { AiPayload } from "../lib/api-types";

export const AI_RUNTIME: AiPayload = {
  runtime: "online",
  modelsLoaded: 3,
  models: [
    { name: "qwen2.5-coder:1.5b", sizeGb: 1.1, active: true },
    { name: "nomic-embed-text", sizeGb: 0.3, active: false },
    { name: "llama3.1:8b", sizeGb: 4.9, active: false }
  ],
  activeModel: "qwen2.5-coder:1.5b",
  responseSpeedTokensPerSec: 38,
  modelStorageUsedGb: 6.3,
  modelStorageTotalGb: 40,
  searchConnected: true,
  computeMode: "GPU",
  aiNodeMemoryPercent: 61,
  lastPromptTest: {
    prompt: "Summarize current cluster health",
    result: "4/4 nodes ready, no pod failures, Argo CD fully synced.",
    at: "6m ago"
  }
};
