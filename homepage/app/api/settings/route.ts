import { NextResponse } from "next/server";
import type { ApiEnvelope, SettingsPayload } from "../../lib/api-types";
import { SETTINGS_STORE } from "../../data/settings";

export async function GET() {
  const body: ApiEnvelope<SettingsPayload> = {
    data: SETTINGS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as Partial<SettingsPayload>;

  if (typeof payload.ntfyTopic === "string") {
    SETTINGS_STORE.ntfyTopic = payload.ntfyTopic;
  }

  const body: ApiEnvelope<SettingsPayload> = {
    data: SETTINGS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
