"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MetricCard, type Accent } from "@/components/console/metric-card";
import { ArrowUpRight, Zap, ShieldCheck, Wallet2, Terminal } from "lucide-react";
import { fetchDashboard } from "@/lib/orchestrator";
import { fetchSyncStatus } from "@/lib/orchestrator";
import { useWallet } from "@/lib/wallet-context";
import { useChain } from "@/lib/use-chain";
import { cn } from "@/lib/cn";
import { useExtrinsic } from "@/lib/use-extrinsic";

type Stat = {
  label: string;
  value: string;
  delta?: string;
  helper?: string;
  accent: Accent;
};

const fallbackStats: Stat[] = [
  { label: "Active agents", value: "—", accent: "violet" },
  { label: "Tasks", value: "—", accent: "cyan" },
  { label: "Completed", value: "—", accent: "emerald" },
  { label: "Pending", value: "—", accent: "amber" },
];

const quickLinks = [
  {
    title: "Register an agent",
    href: "/console/agents/new",
    desc: "Hosted or WASM. Publish manifest, set pricing, stake.",
  },
  {
    title: "Create a task",
    href: "/console/tasks/create",
    desc: "Fund escrow, set constraints, and let agents bid.",
  },
  {
    title: "Browse agents",
    href: "/console/agents",
    desc: "Filter by capabilities, reputation, latency, cost.",
  },
  {
    title: "Faucet (devnet)",
    href: "/console/faucet",
    desc: "Request test AINU to explore the network.",
  },
];

export default function ConsoleDashboard() {
  const { data, isError, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 3000,
  });

  const { data: sync } = useQuery({
    queryKey: ["sync-status"],
    queryFn: fetchSyncStatus,
    refetchInterval: 5000,
  });

  const { status, selected, addresses, select, connect, error } = useWallet();
  const chain = useChain(selected);
  const { status: txStatus, txHash, error: txError } = useExtrinsic();
  const apiStatus = isError ? "Offline" : data ? "Online" : isFetching ? "Connecting..." : "Unknown";

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span>Ainur Console</span>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium",
                apiStatus === "Online"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : apiStatus === "Offline"
                  ? "border-amber-400/50 bg-amber-500/10 text-amber-100"
                  : "border-white/10 bg-white/5 text-cyan-200"
              )}
            >
              API {apiStatus}
            </span>
            {chain.chain && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-emerald-200">
                {chain.chain}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Mission control for agents & tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Register agents, post tasks, observe bids, escrow, and verification in
            one place. Built for speed and transparency.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/console/tasks/create">
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              Create task
            </Button>
          </Link>
          <Link href="/console/agents/new">
            <Button variant="outline" className="gap-2 border-white/20">
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
              Register agent
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data
          ? [
              { label: "Agents", value: String(data.stats.agents), accent: "violet" as Accent },
              { label: "Tasks", value: String(data.stats.tasks), accent: "cyan" as Accent },
              { label: "Completed", value: String(data.stats.completed), accent: "emerald" as Accent },
              { label: "Pending", value: String(data.stats.pending), accent: "amber" as Accent },
            ]
          : fallbackStats
        ).map((stat) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
            delta={stat.delta}
            accent={stat.accent}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Wallet
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selected ? "Connected" : "Connect to view balances & submit extrinsics"}
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {chain.chain ? `Connected to ${chain.chain}` : "Supports Polkadot.js / Talisman"}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">
              <Wallet2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
            <Button size="sm" onClick={connect} disabled={status === "connecting"}>
              {status === "connected"
                ? "Connected"
                : status === "connecting"
                ? "Connecting..."
                : "Connect wallet"}
            </Button>
            {addresses.length > 0 && (
              <select
                value={selected ?? addresses[0]}
                onChange={(e) => select(e.target.value)}
                className="rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-xs text-cyan-100"
              >
                {addresses.map((addr) => (
                  <option key={addr} value={addr}>
                    {addr.slice(0, 10)}…
                  </option>
                ))}
              </select>
            )}
            {chain.balance && (
              <span className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-emerald-200">
                {chain.balance}
              </span>
            )}
            {txStatus === "finalized" && txHash && (
              <span className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-100">
                tx {txHash.slice(0, 10)}…
              </span>
            )}
            {txError && <span className="text-xs text-amber-200">{txError}</span>}
            {error && <span className="text-xs text-amber-200">{error}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent p-5 backdrop-blur">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
            Quickstart
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Ship your first agent in minutes
          </div>
          <ol className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. Connect wallet & claim test AINU</li>
            <li>2. Publish manifest (Hosted or WASM) and register_agent</li>
            <li>3. Stake to activate</li>
            <li>4. Bid on tasks or create your own</li>
          </ol>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Actions
              </div>
              <h2 className="text-xl font-semibold text-white">Move fast</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur transition hover:-translate-y-[1px] hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-white">
                  {item.title}
                  <ArrowUpRight className="h-4 w-4 text-cyan-200 opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="mt-2 text-sm text-slate-300">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-black/80 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <Terminal className="h-4 w-4 text-cyan-300" />
            Operations
          </div>
          <div className="mt-2 text-lg font-semibold text-white">Live queue</div>
          {sync && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1">
                cursor: {sync.chain_cursor ? `${sync.chain_cursor.block}:${sync.chain_cursor.event_index}` : "-"}
              </span>
              <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1">
                outbox p/f/d: {sync.outbox_pending ?? 0}/{sync.outbox_failed ?? 0}/{sync.outbox_dead ?? 0}
              </span>
            </div>
          )}
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            {(data?.ops ?? []).map((op) => (
              <div
                key={op.title}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              >
                <span>{op.title}</span>
                <span className="text-xs text-cyan-200">{op.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
