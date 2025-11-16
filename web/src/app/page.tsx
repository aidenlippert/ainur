import Link from "next/link";
import { HeroSection } from "@/components/sections/hero";
import { StatsSection } from "@/components/sections/stats";
import { LayerStackSection } from "@/components/sections/layer-stack";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-tight text-slate-100 hover:text-white"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-gradient-to-br from-indigo-500/25 to-purple-500/25">
                <span className="text-[11px] font-semibold">AN</span>
              </div>
              <span className="hidden text-[13px] font-semibold tracking-tight sm:inline">
                Ainur Protocol
              </span>
            </Link>
            <nav className="hidden items-center gap-3 text-[13px] font-medium text-slate-400 lg:flex">
              <Link
                href="/"
                className="rounded-md px-2 py-1 hover:bg-slate-800/80 hover:text-slate-100"
              >
                Overview
              </Link>
              <a
                href="https://docs.ainur.network"
                className="rounded-md px-2 py-1 hover:bg-slate-800/80 hover:text-slate-100"
              >
                Documentation
              </a>
              <a
                href="https://github.com/aidenlippert/ainur"
                className="rounded-md px-2 py-1 hover:bg-slate-800/80 hover:text-slate-100"
              >
                GitHub
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <span className="hidden items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 sm:inline-flex">
              <span className="text-[10px] text-slate-500">Docs</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="font-mono text-[10px] text-slate-300">
                docs.ainur.network
              </span>
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]">
              v0.3-alpha
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <HeroSection />
        <StatsSection />
        <LayerStackSection />
      </main>
    </div>
  );
}
