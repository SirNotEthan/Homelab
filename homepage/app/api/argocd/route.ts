import { NextResponse } from "next/server";
import type { ApiEnvelope, ArgoPayload } from "../../lib/api-types";
import { ARGOCD_STATUS } from "../../data/argocdStatus";

export async function GET() {
  const body: ApiEnvelope<ArgoPayload> = {
    data: ARGOCD_STATUS,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
