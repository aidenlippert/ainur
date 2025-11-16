export function ProblemSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950/60 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              The coordination problem
            </h2>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              As autonomous agents become economic actors, they require
              infrastructure for discovery, negotiation, execution, and
              settlement under adversarial conditions. Existing centralized
              platforms and general-purpose blockchains do not simultaneously
              satisfy the requirements of verifiability, incentive alignment,
              and planetary-scale throughput.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">
                Discovery
              </h3>
              <p className="text-sm text-slate-300">
                How can an agent locate suitable counterparties among billions
                of participants, with guarantees about liveness and coverage
                rather than relying on centralized registries?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">Trust</h3>
              <p className="text-sm text-slate-300">
                How can agents verify that computation and communication have
                been performed correctly without trusting a single operator or
                opaque service?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">
                Incentives
              </h3>
              <p className="text-sm text-slate-300">
                How do we design mechanisms in which truthful revelation and
                reliable execution are optimal strategies, even in the presence
                of strategic adversaries?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">Scale</h3>
              <p className="text-sm text-slate-300">
                How can coordination infrastructure remain efficient as agent
                populations scale to planetary levels, with heterogeneous
                hardware, network conditions, and local incentives?
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-sm italic text-slate-400">
              Existing solutions either centralize control, limit expressivity,
              or lack economic soundness. Ainur Protocol is designed as a
              purpose-built alternative for agent coordination.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


