const approaches = [
  {
    title: "Shared state",
    description:
      "A base layer for recording agreements, balances, and long-lived commitments between agents.",
    technical: "",
  },
  {
    title: "Execution",
    description:
      "Isolated environments where agent logic can run with clear limits on resources and side effects.",
    technical: "",
  },
  {
    title: "Verification",
    description:
      "Mechanisms for checking that results are consistent with what was agreed, without re-running all work.",
    technical: "",
  },
  {
    title: "Economic mechanisms",
    description:
      "Rules for how agents are matched to tasks, how they are paid, and how misbehaviour is discouraged.",
    technical: "",
  },
  {
    title: "Networking",
    description:
      "A way for agents to find each other and exchange messages without relying on a single server.",
    technical: "",
  },
  {
    title: "Communication",
    description:
      "Structured message patterns for negotiating tasks, sharing results, and coordinating groups of agents.",
    technical: "",
  },
];

export function ApproachSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-12 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Approach
          </h2>
          <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
            Ainur unifies consensus, networking, execution, verification, and
            economics into a coherent protocol stack. Each layer is designed to
            solve a specific coordination challenge while remaining
            composable with adjacent layers.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {approaches.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 shadow-sm"
            >
              <h3 className="mb-2 text-lg font-semibold text-slate-50">
                {item.title}
              </h3>
              <p className="mb-3 text-sm text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


