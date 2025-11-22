"use client";

import { Button } from "@/components/ui/button";
import { StepTrack } from "@/components/console/step-track";
import { Copy, ExternalLink, Users, Shield, Check } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchTaskDetail } from "@/lib/orchestrator";

export default function TaskDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["task", id],
    enabled: Boolean(id),
    queryFn: () => fetchTaskDetail(id as string),
    refetchInterval: 3000,
  });

  if (isLoading || !data) return (
    <div className="text-sm text-slate-300">Loading task…</div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Task
        </div>
        <h1 className="text-2xl font-semibold text-white">{data.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
            {data.status}
          </span>
          <span className="text-slate-400">{data.id}</span>
          <Copy className="h-3 w-3 text-slate-500" />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Escrow
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{data.escrow}</div>
          <div className="mt-1 text-sm text-slate-300">Min rep: {data.minRep}</div>
          <div className="text-sm text-slate-300">Timeout: {data.timeout}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Match
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{data.matched}</div>
          <div className="mt-1 text-sm text-slate-300">
            Awaiting bids that meet constraints.
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Verification
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {data.verification}
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Dispute window opens after execution.
          </div>
        </div>
      </section>

      <StepTrack steps={data.timeline} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
            Input CID
            <a
              href="#"
              className="flex items-center gap-1 text-[11px] text-cyan-200"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-2 font-mono text-sm text-white">{data.inputCid}</div>
          <div className="mt-2 rounded-lg border border-dashed border-white/15 bg-black/30 p-3 text-xs text-slate-300">
            PDF • 1.2MB • pinned to IPFS
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
            Output CID
            <a
              href="#"
              className="flex items-center gap-1 text-[11px] text-cyan-200"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-2 font-mono text-sm text-slate-400">{data.outputCid}</div>
          <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
            Awaiting agent upload. Coalition Alpha will verify hash → proof.
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <Users className="h-4 w-4 text-cyan-200" />
            Coalition / Match
          </div>
          <div className="mt-2 text-sm text-slate-200">
            {data.matched}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Team Alpha</span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Reputation ≥ 80</span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Latency p50 500ms</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <Shield className="h-4 w-4 text-emerald-200" />
            Verification
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{data.verification}</div>
          <div className="mt-1 text-sm text-slate-300">
            Proof: Hash 0xabc... verified. No disputes filed in window.
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-200">
            <Check className="h-4 w-4" />
            Settlement will release escrow after 60s.
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button size="sm">Cancel task</Button>
        <Button variant="outline" size="sm" className="border-white/20">
          Raise dispute
        </Button>
        <Button variant="ghost" size="sm">
          Export JSON
        </Button>
      </div>
    </div>
  );
}
