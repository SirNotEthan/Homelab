import { NextResponse } from "next/server";
import type { AiPayload, ApiEnvelope } from "../../lib/api-types";
import { AI_RUNTIME } from "../../data/aiRuntime";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://ollama.ai.svc.cluster.local:11434";
const SEARXNG_BASE = process.env.SEARXNG_BASE_URL ?? "http://searxng.ai.svc.cluster.local";

async function fetchJson(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function buildLive(): Promise<AiPayload> {
  const tags = await fetchJson(`${OLLAMA_BASE}/api/tags`);
  const modelList: { name: string; size?: number }[] = tags?.models ?? [];

  let runningNames: string[] = [];
  try {
    const ps = await fetchJson(`${OLLAMA_BASE}/api/ps`, 2500);
    runningNames = (ps?.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    runningNames = [];
  }

  let searchConnected = AI_RUNTIME.searchConnected;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(SEARXNG_BASE, { signal: controller.signal });
    clearTimeout(timer);
    searchConnected = res.ok;
  } catch {
    searchConnected = false;
  }

  const models = modelList.map((m) => ({
    name: m.name,
    sizeGb: Math.round(((m.size ?? 0) / 1024 ** 3) * 10) / 10,
    active: runningNames.includes(m.name)
  }));

  const modelStorageUsedGb = Math.round(models.reduce((s, m) => s + m.sizeGb, 0) * 10) / 10;

  return {
    runtime: "online",
    modelsLoaded: models.length,
    models,
    activeModel: runningNames[0] ?? AI_RUNTIME.activeModel,
    responseSpeedTokensPerSec: AI_RUNTIME.responseSpeedTokensPerSec,
    modelStorageUsedGb,
    modelStorageTotalGb: AI_RUNTIME.modelStorageTotalGb,
    searchConnected,
    computeMode: AI_RUNTIME.computeMode,
    aiNodeMemoryPercent: AI_RUNTIME.aiNodeMemoryPercent,
    lastPromptTest: AI_RUNTIME.lastPromptTest
  };
}

export async function GET() {
  try {
    const data = await buildLive();
    const body: ApiEnvelope<AiPayload> = {
      data,
      meta: { source: "live", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiEnvelope<AiPayload> = {
      data: { ...AI_RUNTIME, runtime: "offline" },
      meta: { source: "mock", generatedAt: new Date().toISOString(), degraded: true }
    };
    return NextResponse.json(body);
  }
}
