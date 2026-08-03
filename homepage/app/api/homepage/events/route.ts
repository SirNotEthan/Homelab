import { NextResponse } from "next/server";
import type { ApiEnvelope, HomepageEvent } from "../../../lib/api-types";
import { TIMELINE_EVENTS } from "../../../data/timelineEvents";

export async function GET() {
  const body: ApiEnvelope<HomepageEvent[]> = {
    data: TIMELINE_EVENTS,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
