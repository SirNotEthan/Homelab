import { NextResponse } from "next/server";
import type { ApiEnvelope, ApplicationsPayload } from "../../lib/api-types";
import { APPLICATIONS } from "../../data/applications";

export async function GET() {
  const body: ApiEnvelope<ApplicationsPayload> = {
    data: APPLICATIONS,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
