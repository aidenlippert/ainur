"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Github, Mail } from "lucide-react";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder integration point for a waitlist service.
    // In production this should submit to a backend or provider.
    console.log("Waitlist submission:", email);
    setSubmitted(true);
  };

  return (
    <section
      id="waitlist"
      className="border-t border-slate-800 bg-slate-950/80 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="mb-10 space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Stay informed
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            Join the waitlist for early access to the testnet and updates on
            protocol design, implementation milestones, and research results.
          </p>
        </div>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="whitespace-nowrap">
              Join waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="mx-auto max-w-md rounded-lg border border-slate-800 bg-slate-950/80 p-6 text-center">
            <div className="text-lg font-semibold text-slate-50">
              Thank you.
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Your address has been recorded for future updates about Ainur
              Protocol.
            </p>
          </div>
        )}

        <div className="mt-16 border-t border-slate-800 pt-10">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold text-slate-50">Resources</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="https://docs.ainur.network/whitepaper/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-center transition hover:border-indigo-400 hover:bg-slate-900"
            >
              <BookOpen className="mx-auto mb-3 h-7 w-7 text-indigo-300" />
              <div className="mb-1 text-sm font-semibold text-slate-50">
                Whitepaper
              </div>
              <div className="text-xs text-slate-300">
                Formal problem statement and protocol design.
              </div>
            </a>
            <a
              href="https://github.com/aidenlippert/ainur"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-center transition hover:border-indigo-400 hover:bg-slate-900"
            >
              <Github className="mx-auto mb-3 h-7 w-7 text-indigo-300" />
              <div className="mb-1 text-sm font-semibold text-slate-50">
                GitHub
              </div>
              <div className="text-xs text-slate-300">
                Source code, issues, and implementation roadmap.
              </div>
            </a>
            <a
              href="mailto:contact@ainur.network"
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-center transition hover:border-indigo-400 hover:bg-slate-900"
            >
              <Mail className="mx-auto mb-3 h-7 w-7 text-indigo-300" />
              <div className="mb-1 text-sm font-semibold text-slate-50">
                Contact
              </div>
              <div className="text-xs text-slate-300">
                Research collaboration and protocol engineering enquiries.
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


