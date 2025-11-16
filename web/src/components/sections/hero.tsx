"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, BookOpen, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { TypewriterEffect } from "@/components/aceternity/typewriter-effect";

const words = [
  { text: "Planetary-scale" },
  { text: "decentralized" },
  { text: "AI", className: "text-primary" },
  { text: "agent", className: "text-primary" },
  { text: "coordination." },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-16">
      <AnimatedGridPattern className="opacity-30" />
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-60" />

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-300 glass-morphism">
              <Rocket className="mr-2 h-3.5 w-3.5 text-indigo-400" />
              <span className="font-mono">v0.3-alpha</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="text-slate-400">Foundation and early implementation</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-50 sm:text-6xl md:text-7xl">
              Ainur Protocol
            </h1>
            <div className="text-xl text-slate-300 md:text-2xl">
              <TypewriterEffect words={words} />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl text-sm text-slate-300 sm:text-base md:text-lg"
          >
            A stratified protocol stack for agents to discover, negotiate,
            execute, and settle tasks under adversarial and economically
            heterogeneous conditions. It unifies consensus, networking,
            runtimes, verification, and incentives in a single, formally
            specified architecture.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <div className="relative">
              <BorderBeam className="rounded-lg" />
              <Button size="lg" className="relative px-6 py-2.5">
                <span className="relative z-10 flex items-center">
                  Request early access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="px-6 py-2.5 text-sm"
              asChild
            >
              <a href="https://docs.ainur.network/introduction/overview/">
                <BookOpen className="mr-2 h-4 w-4" />
                Read documentation
              </a>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="px-6 py-2.5 text-sm"
              asChild
            >
              <a href="https://github.com/aidenlippert/ainur">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Substrate-based PoS, BABE / GRANDPA.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>WASM Component Model runtimes (ARI v2).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>VCG auctions, multi-dimensional reputation.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


