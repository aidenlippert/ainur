"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Users, CheckCircle2, Clock } from "lucide-react";
import { NumberTicker } from "@/components/magicui/number-ticker";

const stats = [
  {
    icon: Clock,
    value: 6,
    suffix: "s",
    label: "Block time",
    description: "BABE consensus",
  },
  {
    icon: CheckCircle2,
    value: 12,
    suffix: "s",
    label: "Finality",
    description: "GRANDPA deterministic",
  },
  {
    icon: Zap,
    value: 1000,
    suffix: "+",
    label: "Throughput",
    description: "Target TPS (Phase B)",
  },
  {
    icon: Users,
    value: 127,
    suffix: "",
    label: "Validators",
    description: "Testnet operators (target)",
  },
];

export function StatsSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="relative py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Protocol at a glance
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Core performance and security parameters for the initial Temporal
            layer deployment.
          </p>
        </div>

        <motion.div
          ref={ref}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm"
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-cyan-500/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-slate-800/80 p-3 text-indigo-300">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-3xl font-semibold text-slate-50">
                    {inView && <NumberTicker value={stat.value} />}
                    {stat.suffix}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {stat.description}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


