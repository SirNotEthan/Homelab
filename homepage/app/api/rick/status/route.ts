import { NextResponse } from "next/server";
import type { ApiEnvelope, ApprovalItem, RickMode, RickStatusPayload } from "../../../lib/api-types";
import { RICK_STATUS_STORE } from "../../../data/approvalQueue";

const VALID_MODES: RickMode[] = ["observe", "diagnose", "plan", "teach", "repair-proposal", "execute"];

export async function GET() {
  const body: ApiEnvelope<RickStatusPayload> = {
    data: RICK_STATUS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as
    | { type: "set-mode"; mode: RickMode }
    | { type: "approve" | "dismiss"; id: string };

  if (payload.type === "set-mode") {
    if (!VALID_MODES.includes(payload.mode)) {
      return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }
    RICK_STATUS_STORE.mode = payload.mode;
  } else if (payload.type === "approve" || payload.type === "dismiss") {
    const index = RICK_STATUS_STORE.approvalQueue.findIndex((item: ApprovalItem) => item.id === payload.id);
    if (index === -1) {
      return NextResponse.json({ error: "Unknown approval item" }, { status: 404 });
    }
    const [item] = RICK_STATUS_STORE.approvalQueue.splice(index, 1);
    RICK_STATUS_STORE.recentActions.unshift({
      text: `${payload.type === "approve" ? "Approved" : "Dismissed"} - ${item.title}`,
      when: "just now"
    });
  } else {
    return NextResponse.json({ error: "Unknown patch type" }, { status: 400 });
  }

  const body: ApiEnvelope<RickStatusPayload> = {
    data: RICK_STATUS_STORE,
    meta: { source: "mock", generatedAt: new Date().toISOString() }
  };

  return NextResponse.json(body);
}
