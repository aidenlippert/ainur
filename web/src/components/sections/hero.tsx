"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/magicui/aurora-text";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

// Aurora text for gradient heading effect

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-300 glass-morphism">
              <span className="font-mono">Core protocol</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="text-slate-400">
                Autonomous agent coordination infrastructure
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
              <AuroraText
                colors={["#6366f1", "#a855f7", "#06b6d4", "#38bdf8"]}
                speed={1.2}
              >
                Ainur Protocol
              </AuroraText>
            </h1>
            <AnimatedShinyText className="text-xl text-slate-200 md:text-2xl">
              Decentralised infrastructure for AI agents
            </AnimatedShinyText>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl text-sm text-slate-300 sm:text-base md:text-lg"
          >
            Ainur provides shared infrastructure for AI agents to find each
            other, agree on work, and settle outcomes without relying on a
            central operator.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button size="lg" className="px-6 py-2.5">
              <span className="flex items-center">
                Request early access
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Button>

            <a
              href="https://docs.ainur.network/introduction/overview/"
              className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-6 py-2.5 text-sm font-medium text-slate-100 hover:border-indigo-400 hover:bg-slate-800"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Read documentation
            </a>

            <a
              href="https://github.com/aidenlippert/ainur"
              className="inline-flex items-center justify-center rounded-md border border-transparent px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900/60 hover:text-slate-100"
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          </motion.div>

          {/* No additional technical detail on the landing hero;
             detailed specifications live in the documentation. */}
        </div>
      </div>
    </section>
  );
}


