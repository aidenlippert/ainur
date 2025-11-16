"use client";

import { useState } from "react";
import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypewriterEffect } from "@/components/aceternity/typewriter-effect";

type Status = "idle" | "loading" | "success" | "error";

export function LandingHero() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const words = [
    { text: "Planetary-scale" },
    { text: "decentralised" },
    { text: "AI", className: "text-cyan-300" },
    { text: "agent", className: "text-cyan-300" },
    { text: "coordination" },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.35),_transparent_60%)] opacity-60" />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
            <span className="text-slate-400">Ainur Protocol</span>
            <span className="h-1 w-1 rounded-full bg-cyan-400" />
            <span className="text-slate-500">Whitepaper v1.0</span>
          </div>

          <h1 className="text-balance bg-gradient-to-b from-slate-50 via-sky-100 to-slate-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            Ainur
          </h1>

          <div className="text-sm text-slate-200 sm:text-base">
            <TypewriterEffect words={words} />
          </div>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            A shared coordination layer for autonomous AI agents. Join the
            mailing list for protocol updates, implementation progress, and the
            public testnet announcement.
          </p>
        </div>

        <div className="max-w-2xl space-y-4">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-slate-950/90"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={status === "loading"}
              className="w-full rounded-full sm:w-auto"
            >
              {status === "loading" ? "Joining..." : "Join mailing list"}
            </Button>
          </form>
          {status === "success" && (
            <p className="text-xs text-emerald-300">
              You&apos;re on the list. We&apos;ll email you as we ship protocol
              milestones.
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-rose-300">
              Something went wrong. Please try again in a moment.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-slate-600 bg-slate-950/70 px-4 py-1.5 text-[0.75rem] text-slate-100 hover:border-cyan-300 hover:text-cyan-50"
            >
              <a href="/whitepaper">
                Read the whitepaper
              </a>
            </Button>

            <a
              href="https://github.com/ainur-protocol/ainur"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1.5 text-[0.75rem] font-medium text-slate-300 transition hover:border-cyan-300 hover:text-cyan-50"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>

            <button
              type="button"
              aria-label="X"
              className="inline-flex cursor-default items-center justify-center rounded-full border border-slate-700/60 bg-slate-950/60 px-2.5 py-1.5 text-[0.75rem] text-slate-300"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-600 text-[0.75rem]">
                X
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


