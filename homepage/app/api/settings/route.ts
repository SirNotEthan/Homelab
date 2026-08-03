import { NextResponse } from "next/server";
import type { ApiEnvelope, SettingsPayload } from "../../lib/api-types";
import { SETTINGS_STORE } from "../../data/settings";
import { sendNtfy } from "../../lib/ntfy";

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

export async function POST() {
  try {
    await sendNtfy(SETTINGS_STORE.ntfyTopic, "Test push from Homelab Core settings.", {
      title: "Homelab Core",
      priority: "default"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 502 });
  }
}
