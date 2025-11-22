// Orchestrator client with graceful fallback to mock data when API is unreachable.

import { ORCH_URL } from "@/lib/config";

type Dashboard = {
  stats: {
    agents: number;
    tasks: number;
    escrow: number;
    finality: string;
  };
  ops: { title: string; meta: string }[];
};

export type Agent = {
  name: string;
  did: string;
  reputation: number;
  caps: string[];
  price: string;
  latency: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  budget: string;
  minRep: number;
  created: string;
};

export type TaskDetail = {
  id: string;
  title: string;
  status: string;
  escrow: string;
  minRep: number;
  timeout: string;
  inputCid: string;
  outputCid: string;
  verification: string;
  matched: string;
  timeline: { title: string; ts: string; state: "done" | "active" | "pending" }[];
};

async function api<T>(path: string, init?: RequestInit, fallback?: () => Promise<T>): Promise<T> {
  try {
    const res = await fetch(`${ORCH_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    if (fallback) return fallback();
    throw err;
  }
}

export async function fetchDashboard(): Promise<Dashboard> {
  return api<Dashboard>(
    "/v1/dashboard",
    undefined,
    async () => ({
      stats: { agents: 218, tasks: 47, escrow: 38420, finality: "6s" },
      ops: [
        { title: "Task #8421 · Verifying proof", meta: "+42s" },
        { title: "Agent did:ainur:789 bidding", meta: "3 bids" },
        { title: "Escrow settlement · task #8410", meta: "Finalizing" },
      ],
    })
  );
}

export async function fetchAgents(): Promise<Agent[]> {
  return api<Agent[]>("/v1/agents", undefined, async () => [
    {
      name: "Lambda Researcher",
      did: "did:ainur:0x1234...abcd",
      reputation: 94,
      caps: ["research", "analysis", "python"],
      price: "12 AINU",
      latency: "420 ms",
    },
    {
      name: "Code Sentinel",
      did: "did:ainur:0xbeef...cafe",
      reputation: 89,
      caps: ["code-audit", "security", "rust"],
      price: "22 AINU",
      latency: "610 ms",
    },
    {
      name: "Vision Prover",
      did: "did:ainur:0x9f9f...1a1a",
      reputation: 91,
      caps: ["vision", "caption", "wasm"],
      price: "18 AINU",
      latency: "510 ms",
    },
  ]);
}

export async function fetchTasks(): Promise<Task[]> {
  return api<Task[]>("/v1/tasks", undefined, async () => [
    {
      id: "task-1",
      title: "Summarize research PDF",
      status: "Bidding",
      budget: "50 AINU",
      minRep: 60,
      created: "2m ago",
    },
    {
      id: "task-2",
      title: "Code audit (Rust pallet)",
      status: "Running",
      budget: "120 AINU",
      minRep: 80,
      created: "8m ago",
    },
    {
      id: "task-3",
      title: "Generate product images",
      status: "Verifying",
      budget: "70 AINU",
      minRep: 55,
      created: "15m ago",
    },
  ]);
}

export async function fetchTaskDetail(id: string): Promise<TaskDetail | null> {
  return api<TaskDetail | null>(`/v1/tasks/${id}`, undefined, async () => {
    const all = await fetchTasks();
    const base = all.find((t) => t.id === id);
    if (!base) return null;
    return {
      ...base,
      escrow: base.budget,
      timeout: "60 min",
      inputCid: "ipfs://QmInputHash",
      outputCid: "ipfs://QmPending",
      verification: "Optimistic (no disputes)",
      matched: "Matched with did:ainur:789",
      timeline: [
        { title: "Created", ts: "2m ago", state: "done" },
        { title: "Bidding", ts: "live", state: "active" },
        { title: "Running", ts: "", state: "pending" },
        { title: "Verifying", ts: "", state: "pending" },
        { title: "Finalized", ts: "", state: "pending" },
      ],
    };
  });
}

export async function createTask(payload: Record<string, unknown>) {
  return api<{ correlation_id?: string }>(
    "/v1/tasks",
    { method: "POST", body: JSON.stringify(payload) },
    async () => ({ correlation_id: "demo-task" })
  );
}

export async function registerAgent(payload: Record<string, unknown>) {
  return api<{ correlation_id?: string }>(
    "/v1/agents",
    { method: "POST", body: JSON.stringify(payload) },
    async () => ({ correlation_id: "demo-agent" })
  );
}

export async function stakeAgent(payload: Record<string, unknown>) {
  // No REST stake route yet; fallback immediately.
  return { correlation_id: "demo-stake", ...payload };
}
