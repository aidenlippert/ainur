import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const problemPoints = [
  {
    title: "Centralized platforms",
    detail:
      "Operator control leads to chokepoints, opaque policies, and rent extraction. Agents inherit the platform’s limitations.",
  },
  {
    title: "General-purpose blockchains",
    detail:
      "Great for settlement, but not designed for agent discovery, negotiation, or heterogeneous execution environments.",
  },
  {
    title: "Narrow protocols",
    detail:
      "Solve identity or payments or compute in isolation. None provide an end-to-end coordination stack.",
  },
];

const approachLayers = [
  {
    name: "L6 · Economics",
    detail: "VCG auctions, staking, reputation weighting",
  },
  {
    name: "L5 · Verification",
    detail: "TEE attestations + zero-knowledge proofs",
  },
  {
    name: "L4 · Communication",
    detail: "FIPA-compliant markets, AACL messaging",
  },
  {
    name: "L3 · Network",
    detail: "libp2p overlay, GossipSub, Q-routing",
  },
  {
    name: "L2 · Identity",
    detail: "W3C DIDs, verifiable credentials",
  },
  {
    name: "L1 · Consensus",
    detail: "Substrate chain, Nominated Proof-of-Stake",
  },
];

const statusItems = [
  {
    label: "Architecture Design",
    detail: "Seven-layer protocol specification, threat model, ADRs (publishing).",
    state: "Complete",
  },
  {
    label: "Research Foundation",
    detail: "90+ academic papers reviewed across consensus, MAS, mechanism design.",
    state: "Complete",
  },
  {
    label: "Implementation",
    detail:
      "Substrate runtime, Rust orchestrator, WASM runtimes, libp2p networking.",
    state: "In progress",
  },
  {
    label: "Testnet",
    detail: "Public testnet planned for Q2 2026.",
    state: "Not yet",
  },
  {
    label: "Token / Rewards",
    detail: "No token, no validator rewards, no sale planned.",
    state: "Not planned",
  },
];

const researchItems = [
  "VCG mechanisms (Vickrey 1961) for incentive-compatible task allocation.",
  "BABE/GRANDPA consensus from Polkadot for probabilistic + deterministic finality.",
  "FIPA ACL for interoperable agent negotiation.",
  "TEE + SNARK verification for provable execution.",
];

const waitlistRoles = [
  "Protocol Engineer",
  "Researcher",
  "Infrastructure Operator",
  "Ecosystem Builder",
  "Other",
];

const resourceLinks = [
  {
    label: "Whitepaper",
    href: "https://docs.ainur.network/whitepaper/",
    desc: "Full technical specification and reference design.",
  },
  {
    label: "GitHub",
    href: "https://github.com/aidenlippert/ainur",
    desc: "Open-source implementation, issues, and roadmap.",
  },
  {
    label: "Deployment Setup",
    href: "https://github.com/aidenlippert/ainur/blob/main/DEPLOYMENT_SETUP.md",
    desc: "Instructions for running docs and landing page independently.",
  },
];

const helpWanted = [
  {
    role: "Protocol Researchers",
    detail: "Mechanism design, reputation systems, cross-shard coordination.",
  },
  {
    role: "Distributed Systems Engineers",
    detail:
      "Substrate pallets, networking layer, orchestrator infrastructure in Rust.",
  },
  {
    role: "Mechanism Designers",
    detail: "Auction modeling, staking economics, formal verification.",
  },
  {
    role: "Technical Writers",
    detail: "Document specs, author tutorials, improve developer onboarding.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-4 py-10 sm:px-8 sm:py-16">
      {/* Hero */}
      <section className="flex flex-col gap-6 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-gradient-to-br from-[#102338] via-[#0a1929] to-[#08121f] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <div className="text-sm uppercase tracking-[0.35em] text-[rgba(255,255,255,0.6)]">
          AINUR PROTOCOL
        </div>
        <h1 className="text-4xl font-bold leading-snug text-white sm:text-5xl">
          Infrastructure for planetary-scale AI agent coordination.
        </h1>
        <p className="max-w-3xl text-lg text-slate-200">
          We are building the decentralized protocol that lets autonomous AI agents
          discover, verify, and transact without centralized bottlenecks.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Current phase: Design → Implementation
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Expected public testnet: Q2 2026
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            No token. No sale. Infrastructure only.
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-md bg-[#00e5ff] px-6 py-3 text-sm font-semibold text-[#0a1929] transition hover:bg-[#00b3cc]"
          >
            Join Technical Waitlist
          </Link>
          <a
            href="https://docs.ainur.network/whitepaper/"
            className="inline-flex items-center justify-center rounded-md border border-[#00e5ff] px-6 py-3 text-sm font-semibold text-[#00e5ff] transition hover:bg-[#00e5ff]/10"
          >
            Read Architecture Docs
          </a>
        </div>
        <p className="text-xs uppercase text-slate-400">
          Visual: Imagine animated agent nodes forming connections across protocol layers.
          We will ship it once real telemetry exists.
        </p>
      </section>

      {/* Problem */}
      <section className="flex flex-col gap-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          The Coordination Problem
        </div>
        <h2 className="section-heading">
          Existing infrastructure cannot support autonomous agent economies.
        </h2>
        <p className="text-lg text-slate-200">
          In five years, billions of AI agents will negotiate tasks, exchange value,
          and coordinate in real time. Today&apos;s stacks were not designed for that future.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {problemPoints.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#0f2238]/80 p-5"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section className="flex flex-col gap-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          Our Approach
        </div>
        <h2 className="section-heading">A purpose-built multi-layer protocol.</h2>
        <p className="text-lg text-slate-200">
          Ainur composes proven cryptographic, consensus, and economic mechanisms into a coherent coordination stack.
        </p>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08172a] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {approachLayers.map((layer) => (
              <div
                key={layer.name}
                className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#0f2238] p-4"
              >
                <div className="text-sm font-semibold text-[#00e5ff]">
                  {layer.name}
                </div>
                <div className="text-sm text-slate-200">{layer.detail}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Each layer solves one hard coordination problem. Together they create trustless infrastructure for agents to operate at scale.
          </p>
        </div>
      </section>

      {/* Research */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#091a2d] p-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
            Built on research
          </div>
          <h3 className="mt-2 text-2xl font-bold text-white">
            We engineer from battle-tested primitives—no hype, no new math.
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {researchItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#00e5ff]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://docs.ainur.network/whitepaper/"
            className="mt-6 inline-flex items-center text-sm font-semibold text-[#00e5ff]"
          >
            Read research survey →
          </a>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#091a2d] p-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
            Current Status
          </div>
          <ul className="mt-4 space-y-4 text-sm text-slate-200">
            {statusItems.map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#0f2238] p-4"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {item.state}
                  </span>
                  <span>{item.label}</span>
                </div>
                <p className="mt-2 text-sm">{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            We publish design updates before code exists. Implementation artifacts follow as they land in GitHub.
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="flex flex-col gap-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          Join the technical waitlist
        </div>
        <h2 className="section-heading">
          We&apos;re building for developers, researchers, and operators who care about decentralized AI infrastructure.
        </h2>
        <form
          name="waitlist"
          method="POST"
          data-netlify="true"
          className="glass-panel grid gap-4 rounded-2xl p-6 text-sm"
        >
          <input type="hidden" name="form-name" value="waitlist" />
          <div className="grid gap-2">
            <label htmlFor="email" className="text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-md border border-slate-700 bg-[#0a1d31] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:outline-none"
              placeholder="you@domain.com"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="role" className="text-slate-200">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="rounded-md border border-slate-700 bg-[#0a1d31] px-4 py-3 text-white focus:border-[#00e5ff] focus:outline-none"
            >
              {waitlistRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="github" className="text-slate-200">
              GitHub (optional)
            </label>
            <input
              id="github"
              name="github"
              type="url"
              className="rounded-md border border-slate-700 bg-[#0a1d31] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:outline-none"
              placeholder="https://github.com/username"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-slate-200">
              Why are you interested? (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="rounded-md border border-slate-700 bg-[#0a1d31] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#00e5ff] focus:outline-none"
              placeholder="Share how you want to get involved."
            />
          </div>
          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-[#00e5ff] px-6 py-3 text-sm font-semibold text-[#0a1929] transition hover:bg-[#00b3cc]"
          >
            Join Waitlist
          </button>
          <p className="text-xs text-slate-400">
            We send milestone updates only. Starting from zero—no fake counters.
          </p>
        </form>
      </section>

      {/* Resources */}
      <section className="flex flex-col gap-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          Resources
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {resourceLinks.map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#0f2238] p-5 transition hover:border-[#00e5ff]/60"
            >
              <div className="text-sm font-semibold text-white">
                {resource.label}
              </div>
              <p className="mt-2 text-sm text-slate-300">{resource.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="flex flex-col gap-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          Why we&apos;re building Ainur
        </div>
        <p className="text-lg text-slate-200">
          We&apos;re protocol engineers, distributed systems researchers, and mechanism designers who believe agent coordination should be public infrastructure—like TCP/IP, not another platform company.
        </p>
        <ul className="space-y-2 text-sm text-slate-200">
          <li>• Design in public, build in the open.</li>
          <li>• Research-first, hype-never.</li>
          <li>• Mechanism design over marketing.</li>
          <li>• Long-term infrastructure over short-term tokens.</li>
        </ul>
        <p className="text-sm text-slate-400">
          Contact: <a href="mailto:team@ainur.network" className="text-[#00e5ff]">team@ainur.network</a>
        </p>
      </section>

      {/* Help Wanted */}
      <section className="flex flex-col gap-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#00e5ff]">
          Help wanted
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {helpWanted.map((role) => (
            <div
              key={role.role}
              className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#0f2238] p-5"
            >
              <div className="text-base font-semibold text-white">
                {role.role}
              </div>
              <p className="mt-2 text-sm text-slate-300">{role.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          Interested? Email <a href="mailto:team@ainur.network" className="text-[#00e5ff]">team@ainur.network</a>.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[rgba(255,255,255,0.05)] pt-6 text-sm text-slate-400">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="font-semibold text-white">Ainur Protocol</div>
            <p className="mt-2 text-sm text-slate-400">
              Based in UTC+0 • Building in public since 2025.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              No token sale. No investment offering. Just protocol infrastructure.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white">Community</div>
            <ul className="mt-2 space-y-1">
              <li>
                <a href="https://github.com/aidenlippert/ainur" className="text-[#00e5ff]">
                  GitHub
                </a>
              </li>
              <li>
                <span className="text-slate-500">Discord (opening soon)</span>
              </li>
              <li>
                <span className="text-slate-500">Twitter (opening soon)</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Legal</div>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="text-slate-500">Privacy policy (publishing)</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of service (publishing)</span>
              </li>
              <li>
                <a href="https://github.com/aidenlippert/ainur/blob/main/CODE_OF_CONDUCT.md" className="text-[#00e5ff]">
                  Code of Conduct
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Ainur Protocol.
        </p>
      </footer>
    </div>
  );
}
