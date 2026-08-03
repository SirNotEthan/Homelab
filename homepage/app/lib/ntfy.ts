// Server-only helper - talks to the in-cluster ntfy Service directly rather
// than round-tripping through the public ingress.
const NTFY_BASE_URL = process.env.NTFY_BASE_URL ?? "http://ntfy.ntfy.svc.cluster.local";

export async function sendNtfy(
  topic: string,
  message: string,
  opts?: { title?: string; priority?: "min" | "low" | "default" | "high" | "urgent" }
) {
  if (!topic) throw new Error("no ntfy topic configured");

  const headers: Record<string, string> = {};
  if (opts?.title) headers.Title = opts.title;
  if (opts?.priority) headers.Priority = opts.priority;

  const response = await fetch(`${NTFY_BASE_URL}/${encodeURIComponent(topic)}`, {
    method: "POST",
    body: message,
    headers
  });

  if (!response.ok) {
    throw new Error(`ntfy push failed: ${response.status} ${response.statusText}`);
  }
}
