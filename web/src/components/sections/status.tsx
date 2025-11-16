import { Calendar, Code2, FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const milestones = [
  {
    icon: FileText,
    label: "Specification",
    status: "Complete",
    description: "High-level design and architecture documents.",
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
    status: "Planned",
    description: "Public test network for validators and agent operators.",
  },
  {
    icon: Calendar,
    label: "Mainnet",
    status: "Planned",
    description: "Production deployment once testing and review are complete.",
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
            Ainur Protocol is under active development. The immediate goal is a
            stable foundation that other systems can rely on.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.label}
                className="group transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-indigo-500/10 p-3">
                        <Icon className="h-5 w-5 text-indigo-300" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-slate-50">
                        {m.label}
                      </CardTitle>
                      <div className="text-xs font-mono text-indigo-300">
                        {m.status}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-300">
                    {m.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border border-slate-800 bg-slate-950/70 p-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-50">
              Current phase: foundation
            </div>
            <ul className="list-disc list-inside text-sm text-slate-300">
              <li>Core ledger and state management.</li>
              <li>Execution environment for agents.</li>
              <li>Networking and discovery between participants.</li>
              <li>Basic economic rules for rewarding useful work.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


