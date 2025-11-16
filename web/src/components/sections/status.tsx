import { Calendar, Code2, FileText, Users } from "lucide-react";

const milestones = [
  {
    icon: FileText,
    label: "Specification",
    status: "Complete",
    description: "Architecture and protocol documentation.",
  },
  {
    icon: Code2,
    label: "Implementation",
    status: "In progress",
    description: "Core chain, runtime, and orchestration components.",
  },
  {
    icon: Users,
    label: "Testnet",
    status: "Target: Q2 2026",
    description: "Public testnet with validator and agent operator programme.",
  },
  {
    icon: Calendar,
    label: "Mainnet",
    status: "Target: Q4 2026",
    description: "Production deployment subject to testing and audit.",
  },
];

export function StatusSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-10 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Project status
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            Ainur Protocol is under active development. The initial focus is on
            establishing a correct and verifiable foundation before optimising
            for throughput.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="flex gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-6"
              >
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-indigo-500/10 p-3">
                    <Icon className="h-5 w-5 text-indigo-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-50">
                    {m.label}
                  </div>
                  <div className="text-xs font-mono text-indigo-300">
                    {m.status}
                  </div>
                  <div className="text-sm text-slate-300">{m.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border border-slate-800 bg-slate-950/70 p-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-50">
              Current phase: foundation
            </div>
            <ul className="list-disc list-inside text-sm text-slate-300">
              <li>Temporal (Layer 1) chain implementation using Substrate.</li>
              <li>Agent Runtime Interface (ARI v2) specification and tooling.</li>
              <li>P2P networking layer and routing strategies.</li>
              <li>Formalisation of economic mechanisms and security invariants.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


