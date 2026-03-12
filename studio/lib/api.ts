import type {
  Run,
  QueueItem,
  Decision,
  AuditEntry,
  PreflightCheck,
} from "./types";

// Server-side (RSC) fetch has no browser context, so relative URLs fail.
// Use API_URL env var for server-side, empty string for client-side (proxied via Next.js rewrites).
const BASE =
  typeof window === "undefined"
    ? process.env.API_URL || "http://127.0.0.1:3000"
    : "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  preflight: () =>
    get<{ checks: PreflightCheck[] }>("/api/preflight").then((r) => r.checks),

  startRun: (payload: {
    inputSource: string;
    query?: string;
    notes?: string;
    mode: string;
    targetRepo?: string;
    mockMode?: boolean;
  }) => post<{ runId: string }>("/api/run", payload),

  getRun: (id: string) => get<Run>(`/api/run/${id}`),

  listRuns: () => get<{ runs: Run[] }>("/api/runs").then((r) => r.runs),

  streamRun: (id: string, onEvent: (event: unknown) => void) => {
    const source = new EventSource(`/api/run/${id}/stream`);
    source.onmessage = (e) => onEvent(JSON.parse(e.data));
    return () => source.close();
  },

  getQueue: () => get<QueueItem[]>("/api/queue"),

  resolveQueueItem: (id: string, resolution: "approved" | "rejected") =>
    post<QueueItem>(`/api/queue/${id}/resolve`, { resolution }),

  getDecisions: (runId: string) =>
    get<Decision[]>(`/api/run/${runId}/decisions`),

  getAudit: (runId: string) =>
    get<AuditEntry[]>(`/api/run/${runId}/audit`),
};
