"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-gradient-to-br from-indigo-500/30 to-purple-500/30">
            <span className="text-xs font-semibold text-slate-50">AN</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-100">
            Ainur Protocol
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-xs font-medium text-slate-300 sm:flex">
          <a
            href="https://docs.ainur.network"
            className="transition hover:text-slate-50"
          >
            Documentation
          </a>
          <a
            href="https://docs.ainur.network/whitepaper/"
            className="transition hover:text-slate-50"
          >
            Whitepaper
          </a>
          <a
            href="https://github.com/aidenlippert/ainur"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-300 transition hover:text-slate-50"
          >
            <Github className="h-4 w-4" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-slate-400 sm:inline">
            Foundation phase
          </span>
          <Button size="sm" className="text-xs px-3 py-1" asChild>
            <Link href="#waitlist">Join waitlist</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}


