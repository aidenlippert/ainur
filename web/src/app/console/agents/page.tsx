"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Copy, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/lib/orchestrator";

export default function AgentsPage() {
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Agents
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Discover and manage agents
          </h1>
          <p className="text-sm text-slate-300">
            Filter by capability, reputation, cost, and latency. Register your own
            to start earning.
          </p>
        </div>
        <Link href="/console/agents/new">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            Register agent
          </Button>
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <div
            key={agent.did}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  {agent.name}
                  <BadgeCheck className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  {agent.did}
                  <Copy className="h-3 w-3 cursor-pointer text-slate-500" />
                </div>
              </div>
              <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-cyan-200">
                Rep {agent.reputation}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(agent.caps ?? []).map((cap) => (
                <span
                  key={cap}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                >
                  {cap}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-slate-200">
              <div className="font-mono text-cyan-200">{agent.price}</div>
              <div className="text-slate-400">Latency: {agent.latency}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={`/console/agents/${encodeURIComponent(agent.did)}`}>
                <Button size="sm">View profile</Button>
              </Link>
              <Button variant="outline" size="sm" className="border-white/20">
                Invite to coalition
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
