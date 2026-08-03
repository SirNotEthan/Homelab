import { NextResponse } from "next/server";
import type { ApiEnvelope, ApprovalItem, StewardMode, StewardStatusPayload } from "../../../lib/api-types";
import { STEWARD_STATUS_STORE } from "../../../data/approvalQueue";

const VALID_MODES: StewardMode[] = ["observe", "diagnose", "plan", "teach", "repair-proposal", "execute"];

export async function GET() {
  const body: ApiEnvelope<StewardStatusPayload> = {
    data: STEWARD_STATUS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as
    | { type: "set-mode"; mode: StewardMode }
    | { type: "approve" | "dismiss"; id: string };

  if (payload.type === "set-mode") {
    if (!VALID_MODES.includes(payload.mode)) {
      return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }
    STEWARD_STATUS_STORE.mode = payload.mode;
  } else if (payload.type === "approve" || payload.type === "dismiss") {
    const index = STEWARD_STATUS_STORE.approvalQueue.findIndex((item: ApprovalItem) => item.id === payload.id);
    if (index === -1) {
      return NextResponse.json({ error: "Unknown approval item" }, { status: 404 });
    }
    const [item] = STEWARD_STATUS_STORE.approvalQueue.splice(index, 1);
    STEWARD_STATUS_STORE.recentActions.unshift({
      text: `${payload.type === "approve" ? "Approved" : "Dismissed"} - ${item.title}`,
      when: "just now"
    });
  } else {
    return NextResponse.json({ error: "Unknown patch type" }, { status: 400 });
  }

  const body: ApiEnvelope<StewardStatusPayload> = {
    data: STEWARD_STATUS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
