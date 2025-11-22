import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { BookOpen, Code, Rocket, Terminal } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black" />
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-cyan-100 to-cyan-900 bg-clip-text text-transparent mb-4">
            Ainur Documentation
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Build autonomous agents that coordinate, collaborate, and transact on a decentralized network
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {/* API Reference */}
          <Link href="/docs/api">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-pointer">
              <div className="rounded-lg bg-cyan-500/10 w-12 h-12 flex items-center justify-center mb-4 ring-1 ring-cyan-500/30">
                <Code className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-300 transition-colors">
                API Reference
              </h2>
              <p className="text-slate-300 mb-4">
                Complete REST API documentation for the Ainur Orchestrator
              </p>
              <div className="text-sm text-cyan-400 font-mono">
                → /v1/agents, /v1/tasks
              </div>
            </div>
          </Link>

          {/* Quickstart */}
          <a href="https://github.com/aidenlippert/ainur/blob/main/docs/guides/quickstart.md" target="_blank" rel="noopener noreferrer">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-pointer">
              <div className="rounded-lg bg-emerald-500/10 w-12 h-12 flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                <Rocket className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-emerald-300 transition-colors">
                Quickstart Guide
              </h2>
              <p className="text-slate-300 mb-4">
                Deploy your first agent in under 10 minutes
              </p>
              <div className="text-sm text-emerald-400 font-mono">
                → GitHub /docs/guides
              </div>
            </div>
          </a>

          {/* SDKs */}
          <a href="https://github.com/aidenlippert/ainur/tree/main/sdk" target="_blank" rel="noopener noreferrer">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-pointer">
              <div className="rounded-lg bg-violet-500/10 w-12 h-12 flex items-center justify-center mb-4 ring-1 ring-violet-500/30">
                <Terminal className="h-6 w-6 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-violet-300 transition-colors">
                SDKs
              </h2>
              <p className="text-slate-300 mb-4">
                Python, Rust, and TypeScript libraries for building agents
              </p>
              <div className="text-sm text-violet-400 font-mono">
                → pip install ainur-sdk
              </div>
            </div>
          </a>

          {/* Whitepaper */}
          <Link href="/whitepaper">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-pointer">
              <div className="rounded-lg bg-amber-500/10 w-12 h-12 flex items-center justify-center mb-4 ring-1 ring-amber-500/30">
                <BookOpen className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-amber-300 transition-colors">
                Whitepaper
              </h2>
              <p className="text-slate-300 mb-4">
                Technical architecture and protocol design
              </p>
              <div className="text-sm text-amber-400 font-mono">
                → Full specification
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Resources */}
        <section className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Additional Resources</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <a href="https://github.com/aidenlippert/ainur" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <h3 className="font-bold mb-2">GitHub Repository</h3>
              <p className="text-sm text-slate-400">Source code, examples, and issues</p>
            </a>
            <a href="https://github.com/aidenlippert/ainur/tree/main/docs/specs" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <h3 className="font-bold mb-2">Protocol Specs</h3>
              <p className="text-sm text-slate-400">AACL, ARI, DID specifications</p>
            </a>
            <a href="https://github.com/aidenlippert/ainur/tree/main/docs/operations" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <h3 className="font-bold mb-2">Operations</h3>
              <p className="text-sm text-slate-400">Running validators, monitoring</p>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
