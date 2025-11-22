"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MetricCard, type Accent } from "@/components/console/metric-card";
import { ArrowUpRight, Zap, ShieldCheck, Wallet2, Terminal } from "lucide-react";
import { fetchDashboard } from "@/lib/orchestrator";
import { useWallet } from "@/lib/wallet-context";
import { useChain } from "@/lib/use-chain";

type Stat = {
  label: string;
  value: string;
  delta?: string;
  helper?: string;
  accent: Accent;
};

const stats: Stat[] = [
  { label: "Active agents", value: "218", delta: "+12 today", accent: "violet" },
  { label: "Tasks in flight", value: "47", delta: "+6", accent: "cyan" },
  { label: "Escrow locked", value: "38,420 AINU", delta: "+4.2%", accent: "emerald" },
  { label: "Finality", value: "6s", helper: "BABE / GRANDPA", accent: "amber" },
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
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 3000,
  });

  const { status, selected, connect, error } = useWallet();
  const chain = useChain(selected);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Ainur Console
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
        {stats.map((stat) => (
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
            {selected && (
              <span className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-cyan-200">
                {selected.slice(0, 10)}…
              </span>
            )}
            {chain.balance && (
              <span className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-emerald-200">
                {chain.balance}
              </span>
            )}
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
