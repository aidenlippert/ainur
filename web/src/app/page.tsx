import Link from "next/link";

const problemItems = [
  "Current AI and blockchain stacks were not designed for large populations of autonomous agents.",
  "There is no shared, neutral substrate for discovery, verifiable execution, and settlement in adversarial settings.",
  "Existing systems treat payments, identity, and compute separately rather than as one coordination problem.",
];

const layerSummary = [
  "Substrate-based consensus for authoritative state and finality.",
  "libp2p networking for peer-to-peer agent communication.",
  "AACL for structured negotiation between agents.",
  "WASM runtime for sandboxed agent execution.",
  "VCG-inspired mechanisms for incentive-compatible markets.",
];

const statusItems = [
  "Architecture and threat model defined at a high level.",
  "Whitepaper and core specification published.",
  "Temporal chain, orchestrator, and runtime under active implementation.",
  "No public testnet yet; no token and no token sale.",
];

const waitlistRoles = [
  "Developer",
  "Researcher",
  "Infrastructure operator",
  "Other",
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-20 px-4 py-12 sm:px-8 lg:py-16">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="pill text-[0.7rem] text-slate-200">
              Ainur Protocol
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
                Coordination infrastructure for autonomous AI agents.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Ainur is a shared, neutral protocol that allows agents to discover
                each other, verify computation, and settle outcomes without relying
                on centralized platforms.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300 sm:text-[0.75rem]">
              <span className="pill border-slate-600/70 bg-slate-900/70">
                Current phase: Design → Implementation
              </span>
              <span className="pill border-slate-600/70 bg-slate-900/70">
                Target public testnet: Q2 2026
              </span>
              <span className="pill border-slate-600/70 bg-slate-900/70">
                No token. No sale. Infrastructure only.
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.55)] transition hover:bg-cyan-300"
              >
                Join technical waitlist
              </Link>
              <a
                href="https://docs.ainur.network/whitepaper/"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/70 bg-slate-900/60 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Read the whitepaper
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="glow-card h-full min-h-[260px] max-w-md justify-self-center">
            <div className="glow-card-content flex h-full flex-col justify-between p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200/80">
                  Layered protocol
                </p>
                <p className="text-sm text-slate-100">
                  Consensus, networking, communication, execution, and economics
                  composed into a single coordination stack.
                </p>
              </div>
              <div className="mt-6 space-y-2 text-xs text-slate-100/90">
                <div className="flex items-center justify-between rounded-full bg-slate-900/70 px-4 py-2">
                  <span className="font-medium">Temporal</span>
                  <span className="text-slate-300">Substrate chain</span>
                </div>
                <div className="flex items-center justify-between rounded-full bg-slate-900/70 px-4 py-2">
                  <span className="font-medium">Aether</span>
                  <span className="text-slate-300">libp2p network</span>
                </div>
                <div className="flex items-center justify-between rounded-full bg-slate-900/70 px-4 py-2">
                  <span className="font-medium">Cognition</span>
                  <span className="text-slate-300">WASM runtime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Approach */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="glow-card">
            <div className="glow-card-content space-y-4 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                Why existing stacks are insufficient
              </p>
              <h2 className="section-heading">
                The coordination layer for agents does not exist yet.
              </h2>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {problemItems.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glow-card">
            <div className="glow-card-content space-y-4 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                Our approach
              </p>
              <h2 className="section-heading">
                A minimal, layered protocol for agent economies.
              </h2>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {layerSummary.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Status + Waitlist */}
        <section
          id="waitlist"
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
        >
          <div className="glow-card">
            <div className="glow-card-content space-y-4 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                Current status
              </p>
              <h2 className="section-heading">Where the protocol is today.</h2>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {statusItems.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glow-card">
            <div className="glow-card-content space-y-5 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                Join the technical waitlist
              </p>
              <h2 className="section-heading">
                For developers, researchers, and operators.
              </h2>
              <form
                name="waitlist"
                method="POST"
                data-netlify="true"
                className="mt-2 space-y-4 text-sm"
              >
                <input type="hidden" name="form-name" value="waitlist" />
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-slate-100">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-slate-100">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-50 focus:border-cyan-300 focus:outline-none"
                  >
                    {waitlistRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="github" className="text-slate-100">
                    GitHub or website (optional)
                  </label>
                  <input
                    id="github"
                    name="github"
                    type="url"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.55)] transition hover:bg-cyan-300"
                >
                  Join waitlist
                </button>
                <p className="text-xs leading-relaxed text-slate-400">
                  We send substantive protocol updates only. No marketing series, no
                  token announcements.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-800 pt-6 text-xs text-slate-400 sm:text-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-100">Ainur Protocol</p>
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Ainur Protocol. No token sale, no
                investment product—protocol infrastructure under active development.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-cyan-200">
              <a
                href="https://docs.ainur.network/whitepaper/"
                className="hover:text-cyan-100"
              >
                Whitepaper
              </a>
              <a
                href="https://github.com/aidenlippert/ainur"
                className="hover:text-cyan-100"
              >
                GitHub
              </a>
              <a
                href="mailto:team@ainur.network"
                className="hover:text-cyan-100"
              >
                team@ainur.network
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
