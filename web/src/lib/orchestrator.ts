// Orchestrator client with graceful fallback to mock data when API is unreachable.

import { ORCH_URL } from "@/lib/config";

type Dashboard = {
  stats: {
    agents: number;
    tasks: number;
    completed: number;
    pending: number;
    escrow?: number;
    finality?: string;
  };
  ops: { title: string; meta: string }[];
};

type RawDashboard = {
  total_agents?: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  ops?: { title: string; meta: string }[];
};

export type SyncStatus = {
  chain_cursor?: { block: number; event_index: number };
  outbox_pending?: number;
  outbox_failed?: number;
  outbox_dead?: number;
};

export type Agent = {
  name: string;
  did: string;
  reputation?: number;
  caps?: string[];
  price?: string;
  latency?: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  budget: string;
  minRep?: number;
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

type RawAgent = {
  id?: string;
  did?: string;
  label?: string;
  name?: string;
  reputation?: number;
  capabilities?: string[];
  caps?: string[];
  price?: string;
  latency?: string;
};

type RawTask = {
  id: string;
  description?: string;
  title?: string;
  status?: string;
  max_budget?: number | string;
  budget?: string;
  min_reputation?: number;
  minRep?: number;
  created_at?: number;
  created?: string;
  deadline?: number;
  input_cid?: string;
  output_cid?: string;
  verification?: string;
  matched_agent?: string;
  timeline?: TaskDetail["timeline"];
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
  const fallback = () =>
    Promise.resolve({
      stats: { agents: 218, tasks: 47, completed: 12, pending: 35, escrow: 38420, finality: "6s" },
      ops: [
        { title: "Task #8421 · Verifying proof", meta: "+42s" },
        { title: "Agent did:ainur:789 bidding", meta: "3 bids" },
        { title: "Escrow settlement · task #8410", meta: "Finalizing" },
      ],
    });

  return api<RawDashboard>("/v1/dashboard", undefined, fallback).then((raw) => {
    if (!raw || raw.total_agents === undefined) return raw as unknown as Dashboard;
    return {
      stats: {
        agents: raw.total_agents ?? 0,
        tasks: raw.total_tasks ?? 0,
        completed: raw.completed_tasks ?? 0,
        pending: raw.pending_tasks ?? 0,
      },
      ops: raw.ops ?? [],
    };
  });
}

export async function fetchAgents(): Promise<Agent[]> {
  const toAgent = (raw: RawAgent): Agent => ({
    name: raw.label ?? raw.name ?? raw.id ?? "agent",
    did: raw.id ?? raw.did ?? "",
    reputation: raw.reputation,
    caps: raw.capabilities ?? raw.caps ?? [],
    price: raw.price,
    latency: raw.latency,
  });

  return api<RawAgent[]>("/v1/agents", undefined, async () => [
    { id: "did:ainur:0x1234...abcd", label: "Lambda Researcher" },
    { id: "did:ainur:0xbeef...cafe", label: "Code Sentinel" },
    { id: "did:ainur:0x9f9f...1a1a", label: "Vision Prover" },
  ]).then((arr) => arr.map(toAgent));
}

export async function fetchTasks(): Promise<Task[]> {
  const mapTask = (t: RawTask): Task => ({
    id: t.id,
    title: t.description ?? t.title ?? "Task",
    status: t.status ?? "Pending",
    budget: t.max_budget ? `${t.max_budget} AINU` : t.budget ?? "-",
    minRep: t.min_reputation ?? t.minRep,
    created: t.created_at ? new Date(t.created_at * 1000).toLocaleString() : t.created ?? "",
  });

  return api<RawTask[]>("/v1/tasks", undefined, async () => [
    {
      id: "task-1",
      description: "Summarize research PDF",
      status: "Bidding",
      max_budget: 50,
      min_reputation: 60,
      created_at: Date.now() / 1000,
    },
  ]).then((arr) => arr.map(mapTask));
}

export async function fetchTaskDetail(id: string): Promise<TaskDetail | null> {
  const fallback = async () => {
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
  };

  return api<RawTask | null>(`/v1/tasks/${id}`, undefined, fallback).then((t) => {
    if (!t) return null;
    // If response is already shaped as TaskDetail, return it; otherwise map.
    if ((t as unknown as TaskDetail).escrow && (t as unknown as TaskDetail).inputCid)
      return t as unknown as TaskDetail;
    return {
      id: t.id,
      title: t.description ?? "Task",
      status: t.status ?? "Pending",
      escrow: t.max_budget ? `${t.max_budget} AINU` : t.budget ?? "-",
      minRep: t.min_reputation ?? 0,
      timeout: t.deadline ? `${t.deadline}s` : "",
      inputCid: t.input_cid ?? t.inputCid ?? "",
      outputCid: t.output_cid ?? t.outputCid ?? "",
      verification: t.verification ?? "Optimistic",
      matched: t.matched_agent ?? t.matched ?? "Pending",
      timeline: t.timeline ?? [
        { title: "Created", ts: "", state: "done" },
        { title: "Bidding", ts: "", state: "active" },
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

export async function fetchSyncStatus(): Promise<SyncStatus> {
  return api<SyncStatus>("/v1/sync/status", undefined, async () => ({
    chain_cursor: { block: 0, event_index: 0 },
    outbox_pending: 0,
    outbox_failed: 0,
    outbox_dead: 0,
  }));
}

export async function requestFaucet(address: string) {
  return api<{ correlation_id?: string; address: string; amount: number }>(
    "/v1/faucet",
    {
      method: "POST",
      body: JSON.stringify({ address, amount: 1_000_000_000_000 }),
      headers: { "content-type": "application/json" },
    },
    async () => ({ correlation_id: "demo", address, amount: 1_000_000_000_000 })
  );
}
