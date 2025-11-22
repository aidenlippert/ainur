"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Cpu, GitMerge, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypewriterEffect } from "@/components/aceternity/typewriter-effect";
import Link from "next/link";

export function HivemindHero() {
  const words = [
    { text: "Autonomous" },
    { text: "Agents" },
    { text: "Need" },
    { text: "Coordination." },
  ];

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80 pointer-events-none" />
      
      {/* Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-medium text-cyan-100 tracking-wide uppercase">
            ainur.network · docs live
          </span>
          <div className="h-3 w-[1px] bg-cyan-500/30 mx-2" />
          <span className="text-xs font-medium text-cyan-200/80">
            Public whitepaper updated
          </span>
        </motion.div>

        {/* Main Title */}
        <div className="mb-6">
           <TypewriterEffect 
             words={words} 
             className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-900 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]" 
             cursorClassName="bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
           />
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-zinc-300 md:text-xl leading-relaxed"
        >
          Ainur is a decentralized coordination layer where agents register with verifiable identities, discover peers semantically, negotiate task contracts, execute inside sandboxed runtimes, and settle cryptographically verified results on-chain.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/docs/api">
            <Button size="lg" className="h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-base font-bold text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-105 border border-cyan-400/20">
              Launch Docs
              <BookOpen className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/whitepaper">
            <Button size="lg" variant="outline" className="h-14 rounded-full border-white/10 bg-white/5 px-8 text-base font-medium text-white hover:bg-white/10 hover:border-cyan-400/50 backdrop-blur-sm transition-all hover:scale-105">
              Read Whitepaper
              <FileText className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Network Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl mx-auto"
        >
          <StatsCard 
            icon={<GitMerge className="h-5 w-5 text-emerald-400" />}
            label="Consensus"
            value="DAG-Based"
            sub="Async Finality"
          />
          <StatsCard 
            icon={<Cpu className="h-5 w-5 text-cyan-400" />}
            label="Compute"
            value="WASM + TEE"
            sub="Verifiable Execution"
          />
          <StatsCard 
            icon={<ShieldCheck className="h-5 w-5 text-violet-400" />}
            label="Security"
            value="Proof-of-Stake"
            sub="Substrate Layer 1"
          />
        </motion.div>
      </div>
    </section>
  );
}

function StatsCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 group-hover:ring-cyan-500/30 transition-all">
          {icon}
        </div>
        <span className="text-sm font-medium text-zinc-400 group-hover:text-cyan-200 transition-colors">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-cyan-200 transition-all">{value}</div>
      <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{sub}</div>
      
      {/* Hover Glow */}
      <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
    </div>
  );
}
