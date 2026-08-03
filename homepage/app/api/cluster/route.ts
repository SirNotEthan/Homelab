import { NextResponse } from "next/server";
import type { ApiEnvelope, ClusterPayload } from "../../lib/api-types";
import { CLUSTER_STATUS } from "../../data/clusterStatus";

export async function GET() {
  const body: ApiEnvelope<ClusterPayload> = {
    data: CLUSTER_STATUS,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
