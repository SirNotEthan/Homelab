import { NextResponse } from "next/server";
import type { ApiEnvelope, MonitoringPayload } from "../../lib/api-types";
import { MONITORING_STATUS } from "../../data/monitoringStatus";

export async function GET() {
  const body: ApiEnvelope<MonitoringPayload> = {
    data: MONITORING_STATUS,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
