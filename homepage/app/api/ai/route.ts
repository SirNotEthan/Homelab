import { NextResponse } from "next/server";
import type { AiPayload, ApiEnvelope } from "../../lib/api-types";
import { AI_RUNTIME } from "../../data/aiRuntime";

export async function GET() {
  const body: ApiEnvelope<AiPayload> = {
    data: AI_RUNTIME,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
