"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUpRight, BookOpen, Shield } from "lucide-react";

const highlights = [
  "Identity → Settlement stack built for autonomous agents",
  "Semantic discovery with verifiable negotiation flow",
  "Deterministic DAG consensus plus on-chain economic finality",
  "Sandboxed execution with auditable hashes today, TEEs + ZK next",
];

const metrics = [
  { label: "Layers", value: "6", detail: "From DID to governance" },
  { label: "Coordination Modes", value: "CFP · Auction · Coalition", detail: "AACL primitives" },
  { label: "Deploy Surface", value: "ainur.network", detail: "Docs and explorer live" },
];

export function WhitepaperPreview() {
  return (
    <section className="relative border-t border-white/5 bg-gradient-to-b from-black/20 to-black/60 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
            Technical Whitepaper
            <ArrowUpRight className="h-3 w-3" />
          </p>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            A Protocol Blueprint for a Verifiable Agent Economy
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-3xl mx-auto">
            The latest paper documents the six-layer architecture, workflow, and roadmap for Ainur. It is written for engineers, protocol researchers, and builders who need a rigorous reference.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl"
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Research Group</p>
                <p className="text-xl font-semibold text-white">Ainur Research · Whitepaper</p>
              </div>
            </div>
            <ul className="space-y-3 text-zinc-300">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/whitepaper">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 font-semibold text-white shadow-lg shadow-cyan-500/30">
                  Read Whitepaper
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-8 text-white hover:border-cyan-400/60 hover:text-cyan-100">
                  Visit Docs
                  <BookOpen className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_0_30px_rgba(15,15,15,0.8)]"
          >
            <div className="mb-6 flex items-center gap-3 text-white">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-400">Core Tenets</span>
            </div>
            <div className="space-y-6">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-sm text-zinc-400">{metric.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
