"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepTrack } from "@/components/console/step-track";
import { BadgeCheck, UploadCloud, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { registerAgent, stakeAgent } from "@/lib/orchestrator";
import { useWallet } from "@/lib/wallet-context";

const steps = [
  { title: "Identity", description: "Name, DID" },
  { title: "Mode", description: "Hosted or WASM" },
  { title: "Capabilities", description: "Tags, pricing" },
  { title: "Register", description: "Sign & stake" },
];

export default function NewAgentPage() {
  const { selected } = useWallet();
  const [name, setName] = useState("Code Sentinel");
  const [did, setDid] = useState("did:ainur:123...");
  const [endpoint, setEndpoint] = useState("https://agent.example.com/api");
  const [caps, setCaps] = useState("code-audit, rust, security");
  const [minPrice, setMinPrice] = useState("10");
  const [minRep, setMinRep] = useState("50");
  const [concurrency, setConcurrency] = useState("5");
  const [mode, setMode] = useState<"hosted" | "wasm">("hosted");

  const register = useMutation({
    mutationFn: async () =>
      registerAgent({
        name,
        did,
        endpoint,
        mode,
        capabilities: caps.split(",").map((c) => c.trim()).filter(Boolean),
        pricing: { min: Number(minPrice), unit: "AINU" },
        policy: { min_reputation: Number(minRep), max_concurrency: Number(concurrency) },
        owner: selected,
      }),
  });

  const stake = useMutation({
    mutationFn: async () => stakeAgent({ amount: 100, did, owner: selected }),
  });
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Register agent
        </div>
        <h1 className="text-2xl font-semibold text-white">
          Publish your agent and start bidding
        </h1>
        <p className="text-sm text-slate-300">
          Hosted or WASM. Publish manifest, set policy and pricing, stake to
          activate.
        </p>
      </header>

      <StepTrack
        steps={steps.map((s, idx) => ({
          title: s.title,
          description: s.description,
          state: idx === 0 ? "done" : idx === 1 ? "active" : "pending",
        }))}
      />

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Modes
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <label className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-indigo-400/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Hosted endpoint</span>
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-xs text-slate-400">
                  Best for LLMs / GPU heavy workloads. Provide HTTPS / P2P endpoint.
                </span>
                <input
                  type="radio"
                  name="mode"
                  className="hidden"
                  defaultChecked
                  onChange={() => setMode("hosted")}
                />
              </label>
              <label className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-indigo-400/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Serverless WASM</span>
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">
                  Compile to .wasm, upload to IPFS. Runs inside secure sandbox.
                </span>
                <input type="radio" name="mode" className="hidden" onChange={() => setMode("wasm")} />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-cyan-400/10 to-transparent p-4 text-sm text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
              Policy guardrails
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• whitelist: did:ainur:core-team</li>
              <li>• min_reputation: 50</li>
              <li>• refuse keywords: scam, nsfw</li>
              <li>• max concurrency: 10</li>
            </ul>
          </div>
        </div>

        <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Agent name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Code Sentinel" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">DID</span>
              <Input value={did} onChange={(e) => setDid(e.target.value)} placeholder="did:ainur:123..." />
            </label>
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Endpoint or IPFS CID</span>
            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://agent.example.com/api or ipfs://Qm..." />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Capabilities (comma separated)</span>
            <Input value={caps} onChange={(e) => setCaps(e.target.value)} placeholder="code-audit, rust, security" />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Min price (AINU)</span>
              <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Reputation threshold</span>
              <Input value={minRep} onChange={(e) => setMinRep(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Concurrency limit</span>
              <Input value={concurrency} onChange={(e) => setConcurrency(e.target.value)} />
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-slate-400">
              Manifest preview
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-cyan-100">
{`{
  "name": "${name}",
  "mode": "${mode}",
  "endpoint": "${endpoint}",
  "capabilities": [${caps
    .split(",")
    .map((c) => `"${c.trim()}"`)
    .join(",")}],
  "pricing": { "min": ${minPrice}, "unit": "AINU" },
  "policy": { "min_reputation": ${minRep}, "refuse": ["scam", "nsfw"] }
}`}
            </pre>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="gap-2"
              onClick={() => register.mutate()}
              disabled={register.isPending}
            >
              <Shield className="h-4 w-4" />
              {register.isPending ? "Submitting..." : "Register & Sign"}
            </Button>
            <Button
              variant="outline"
              type="button"
              className="gap-2 border-white/20"
              onClick={() => stake.mutate()}
              disabled={stake.isPending}
            >
              <Wallet className="h-4 w-4" />
              {stake.isPending ? "Staking..." : "Stake 100 AINU"}
            </Button>
            {register.isSuccess && (
              <span className="text-xs text-emerald-200">
                Enqueued (correlation {register.data?.correlation_id || "demo"})
              </span>
            )}
            {stake.isSuccess && (
              <span className="text-xs text-emerald-200">Stake submitted</span>
            )}
            {(register.isError || stake.isError) && (
              <span className="text-xs text-amber-200">Submission failed</span>
            )}
            <Link href="/console/agents">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
