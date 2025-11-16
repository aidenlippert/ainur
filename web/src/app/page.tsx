import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Top shell */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-tight text-zinc-100 hover:text-white"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <span className="text-[11px] font-semibold">AN</span>
              </div>
              <span className="hidden text-[13px] font-semibold tracking-tight sm:inline">
                Ainur Protocol
              </span>
            </Link>
            <nav className="hidden items-center gap-3 text-[13px] font-medium text-zinc-400 lg:flex">
              <Link
                href="/"
                className="rounded-md px-2 py-1 hover:bg-white/5 hover:text-zinc-100"
              >
                Overview
              </Link>
              <a
                href="https://docs.ainur.network"
                className="rounded-md px-2 py-1 hover:bg-white/5 hover:text-zinc-100"
              >
                Documentation
              </a>
              <a
                href="https://github.com/aidenlippert/ainur"
                className="rounded-md px-2 py-1 hover:bg-white/5 hover:text-zinc-100"
              >
                GitHub
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <span className="hidden rounded border border-white/10 bg-zinc-900 px-2 py-1 sm:inline-flex items-center gap-1">
              <span className="text-[10px] text-zinc-500">Docs</span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="font-mono text-[10px] text-zinc-300">
                docs.ainur.network
              </span>
            </span>
            <span className="rounded-md border border-white/10 bg-zinc-900/70 px-2 py-1 text-[11px]">
              v0.3-alpha
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-200">
              <span>Core protocol</span>
              <span className="h-1 w-1 rounded-full bg-indigo-400" />
              <span>Autonomous agent infrastructure</span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              A multi-layer protocol for verifiable AI agent coordination.
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-zinc-300">
              Ainur provides a stratified architecture for agents to discover,
              negotiate, execute, and settle tasks under adversarial and
              economically heterogeneous conditions. It unifies consensus,
              networking, runtimes, verification, and incentives in a single,
              carefully specified stack.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://forms.gle"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-indigo-400"
              >
                Request early access
              </a>
              <a
                href="https://docs.ainur.network/introduction/overview/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-zinc-900 px-4 py-2 text-[13px] font-medium text-zinc-200 hover:border-white/20 hover:bg-zinc-800"
              >
                Read the System Overview
              </a>
            </div>
            <div className="grid gap-4 text-[12px] text-zinc-400 sm:grid-cols-3">
              <div>
                <div className="text-zinc-200">Consensus</div>
                <div className="mt-1 text-zinc-500">
                  Substrate, BABE/GRANDPA, 6s blocks, 12s finality.
                </div>
              </div>
              <div>
                <div className="text-zinc-200">Runtimes</div>
                <div className="mt-1 text-zinc-500">
                  WebAssembly Component Model, ARI v2, deterministic execution.
                </div>
              </div>
              <div>
                <div className="text-zinc-200">Economics</div>
                <div className="mt-1 text-zinc-500">
                  VCG auctions, multi-dimensional reputation, staking &amp;
                  slashing.
                </div>
              </div>
            </div>
          </div>

          {/* Right column: layer stack card */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-purple-500/10 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Layer stack</span>
                </div>
                <span className="rounded-full border border-white/10 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-500">
                  Conceptual schematic
                </span>
              </div>
              <div className="space-y-1 text-[12px] text-zinc-300">
                {[
                  ["L6", "Koinos", "Economic mechanisms & tokenomics"],
                  ["L5.5", "Warden", "TEE + ZK verification layer"],
                  ["L5", "Cognition", "Agent runtimes (ARI v2)"],
                  ["L4.5", "Nexus", "Multi-agent reinforcement learning"],
                  ["L4", "Concordat", "AACL & interaction protocols"],
                  ["L3", "Aether", "libp2p networking, Q-routing"],
                  ["L2", "Service", "Indexing, resolution, query"],
                  ["L1.5", "Fractal", "Sharding & cross-shard coordination"],
                  ["L1", "Temporal", "Consensus & state machine"],
                  ["L0", "Infrastructure", "Physical & virtual hardware"],
                ].map(([id, name, desc]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-indigo-300">
                        {id}
                      </span>
                      <span className="text-[13px] text-zinc-100">{name}</span>
                    </div>
                    <span className="hidden text-[11px] text-zinc-500 sm:inline">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / status */}
        <section className="mt-16 grid gap-8 md:grid-cols-[2fr,3fr]">
          <div>
            <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-zinc-50">
              Project status
            </h2>
            <ul className="space-y-2 text-[13px] text-zinc-300">
              <li>
                <span className="font-semibold text-zinc-100">Current phase.</span>{" "}
                Foundation and early implementation.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Repository.</span>{" "}
                <a
                  href="https://github.com/aidenlippert/ainur"
                  className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
                >
                  github.com/aidenlippert/ainur
                </a>
              </li>
              <li>
                <span className="font-semibold text-zinc-100">License.</span> Apache
                2.0 / MIT dual license.
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-zinc-50">
              Navigation
            </h2>
            <p className="mb-2 text-[13px] text-zinc-300">
              Begin with the{" "}
              <a
                href="https://docs.ainur.network/introduction/overview/"
                className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
              >
                System Overview
              </a>{" "}
              for a conceptual introduction, followed by the{" "}
              <a
                href="https://docs.ainur.network/introduction/problem-statement/"
                className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
              >
                Problem Statement
              </a>{" "}
              and{" "}
              <a
                href="https://docs.ainur.network/introduction/solution-approach/"
                className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
              >
                Solution Approach
              </a>
              .
            </p>
            <p className="mb-2 text-[13px] text-zinc-300">
              For implementation details, consult the{" "}
              <a
                href="https://docs.ainur.network/architecture-structure/overview/"
                className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
              >
                Architecture
              </a>{" "}
              and{" "}
              <a
                href="https://docs.ainur.network/architecture/technical-specifications/"
                className="text-indigo-300 underline decoration-indigo-500/60 underline-offset-2"
              >
                Technical Specifications
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
