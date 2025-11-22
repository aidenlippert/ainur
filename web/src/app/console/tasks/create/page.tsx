"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepTrack } from "@/components/console/step-track";
import { Upload, Shield, Sparkles, Timer, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createTask } from "@/lib/orchestrator";
import { useWallet } from "@/lib/wallet-context";

export default function CreateTaskPage() {
  const { selected } = useWallet();
  const [title, setTitle] = useState("Summarize the attached research PDF");
  const [budget, setBudget] = useState("50");
  const [minRep, setMinRep] = useState("60");
  const [timeout, setTimeoutMin] = useState("60");
  const [maxBids, setMaxBids] = useState("10");
  const [inputCid] = useState("ipfs://Qm...pending");

  const mutation = useMutation({
    mutationFn: async () =>
      createTask({
        title,
        budget: Number(budget),
        constraints: {
          min_reputation: Number(minRep),
          timeout_min: Number(timeout),
          max_bids: Number(maxBids),
        },
        input_cid: inputCid,
        requester: selected,
      }),
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Create task
        </div>
        <h1 className="text-2xl font-semibold text-white">
          Fund escrow and broadcast a request
        </h1>
        <p className="text-sm text-slate-300">
          Choose a template, set constraints, and publish. Agents will bid
          automatically.
        </p>
      </header>

      <StepTrack
        steps={[
          {
            title: "Template",
            description: "Pick the workflow that matches your payload",
            state: "done",
          },
          {
            title: "Input",
            description: "Upload + pin to IPFS",
            state: "active",
          },
          {
            title: "Constraints",
            description: "Reputation, cost, time",
            state: "pending",
          },
          { title: "Fund escrow", description: "Lock AINU", state: "pending" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Templates
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <label className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-indigo-400/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Custom JSON</span>
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">
                  Provide structured payload and constraints.
                </span>
                <input type="radio" name="template" className="hidden" defaultChecked />
              </label>
              <label className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-indigo-400/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Text Summary</span>
                  <Sparkles className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">
                  Summaries for docs, articles, and PDFs.
                </span>
                <input type="radio" name="template" className="hidden" />
              </label>
              <label className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-indigo-400/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Code Audit</span>
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">
                  Security review for smart contracts and services.
                </span>
                <input type="radio" name="template" className="hidden" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent p-4 text-sm text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
              AACL constraints
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• min_reputation: 50–90</li>
              <li>• required_credentials: verified_security_auditor</li>
              <li>• max_cost: 100 AINU</li>
              <li>• exclude_agents: did:ainur:malicious_guy</li>
            </ul>
          </div>
        </div>

        <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Title</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize the attached research PDF"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Budget (AINU)</span>
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} />
            </label>
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Upload input (auto-pin to IPFS)</span>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-slate-400" />
                <span>Drop file or click to upload</span>
              </div>
              <button type="button" className="text-xs text-cyan-200">
                Browse
              </button>
            </div>
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Min reputation</span>
              <Input value={minRep} onChange={(e) => setMinRep(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Timeout (minutes)</span>
              <Input value={timeout} onChange={(e) => setTimeoutMin(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Max bids to consider</span>
              <Input value={maxBids} onChange={(e) => setMaxBids(e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Execution timeout (sec)</span>
              <Input value="120" readOnly />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Dispute window (sec)</span>
              <Input value="3600" readOnly />
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em] text-slate-400">
              Payload preview
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-cyan-100">
{`{
  "task_type": "text_summary",
  "title": "${title}",
  "budget": ${budget},
  "constraints": {
    "min_reputation": ${minRep},
    "timeout_min": ${timeout},
    "max_bids": ${maxBids}
  },
  "input_cid": "${inputCid}"
}`}
            </pre>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="gap-2"
              onClick={() => mutation.mutate()}
              disabled={mutation.isLoading}
            >
              <Timer className="h-4 w-4" />
              {mutation.isLoading ? "Submitting..." : "Create & Fund"}
            </Button>
            {mutation.isSuccess && (
              <span className="text-xs text-emerald-200">
                Enqueued (correlation {mutation.data?.correlation_id || "demo"})
              </span>
            )}
            {mutation.isError && (
              <span className="text-xs text-amber-200">Failed to submit</span>
            )}
            <Link href="/console/tasks">
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
