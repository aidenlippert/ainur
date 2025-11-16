export function ArchitectureSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950/70 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Protocol architecture
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            A multi-layer design separating concerns while enabling cross-layer
            optimisation and verifiable end-to-end behaviour.
          </p>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {[
            [
              "Economic layer",
              "How agents keep track of value, rewards, and simple reputation.",
            ],
            [
              "Verification layer",
              "Ways to check that results match what was agreed, without repeating all the work.",
            ],
            [
              "Runtime layer",
              "Environments where agent code runs with clear limits and isolation.",
            ],
            [
              "Communication layer",
              "Basic patterns for agents to ask, respond, and coordinate with each other.",
            ],
            [
              "Network layer",
              "The connectivity layer that allows agents to find and talk to one another.",
            ],
            [
              "Consensus layer",
              "The shared record that everyone can rely on when they need a final answer.",
            ],
          ].map(([title, desc]) => (
            <div
              key={title as string}
              className="rounded border border-slate-800 bg-slate-950/80 p-4 text-left"
            >
              <div className="text-sm font-semibold text-slate-50">
                {title}
              </div>
              <div className="mt-1 text-xs text-slate-300 sm:text-sm">
                {desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="https://docs.ainur.network/architecture/technical-specifications/"
            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-950 px-5 py-2 text-sm font-medium text-slate-100 hover:border-indigo-400 hover:bg-slate-900"
          >
            View complete specification
          </a>
        </div>
      </div>
    </section>
  );
}


