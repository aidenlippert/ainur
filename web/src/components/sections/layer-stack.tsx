"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Network,
  MessageSquare,
  Cpu,
  Shield,
  Brain,
  DollarSign,
  Server,
  Layers,
} from "lucide-react";

const layers = [
  {
    id: "L6",
    name: "Koinos",
    title: "Economic layer",
    description:
      "VCG auctions, multi-dimensional reputation, staking and slashing.",
    icon: DollarSign,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "L5.5",
    name: "Warden",
    title: "Verification layer",
    description: "TEE attestation and ZK-ML proofs for trustless execution.",
    icon: Shield,
    color: "from-sky-500 to-cyan-500",
  },
  {
    id: "L5",
    name: "Cognition",
    title: "Runtime layer",
    description: "WebAssembly Component Model runtimes (ARI v2).",
    icon: Cpu,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "L4.5",
    name: "Nexus",
    title: "MARL layer",
    description: "Multi-agent reinforcement learning and emergent policies.",
    icon: Brain,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "L4",
    name: "Concordat",
    title: "Communication layer",
    description: "AACL, FIPA-compliant protocols and interaction patterns.",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "L3",
    name: "Aether",
    title: "Network layer",
    description: "libp2p, Kademlia DHT, and Q-routing for global scale.",
    icon: Network,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "L2",
    name: "Service",
    title: "Service layer",
    description: "Resolution, indexing, and query services for agents.",
    icon: Server,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "L1.5",
    name: "Fractal",
    title: "Sharding layer",
    description: "Dynamic sharding and cross-shard coordination.",
    icon: Layers,
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "L1",
    name: "Temporal",
    title: "Consensus layer",
    description: "Substrate-based PoS ledger with 6s blocks and fast finality.",
    icon: Database,
    color: "from-purple-500 to-indigo-500",
  },
];

export function LayerStackSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Nine-layer architecture
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-400 sm:text-base">
            A stratified protocol stack unifying consensus, networking,
            runtimes, verification, and economics into a single coherent design.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-indigo-500/60 via-slate-700 to-cyan-500/60" />

          <div className="space-y-6">
            {layers.map((layer, index) => {
              const alignRight = index % 2 === 1;
              const isActive = hovered === layer.id;
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, x: alignRight ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onMouseEnter={() => setHovered(layer.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative flex ${
                    alignRight ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm backdrop-blur-sm transition-transform duration-300 ${
                      isActive ? "scale-105 shadow-2xl" : ""
                    }`}
                  >
                    {isActive && (
                      <div
                        className={`pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-r ${layer.color} opacity-25 blur-xl`}
                      />
                    )}

                    <div
                      className={`flex items-start gap-4 ${
                        alignRight ? "flex-row-reverse text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-lg bg-gradient-to-br ${layer.color} p-3`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono">{layer.id}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-500" />
                          <span>{layer.name}</span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-50">
                          {layer.title}
                        </h3>
                        <p className="text-xs text-slate-400 sm:text-sm">
                          {layer.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-950 bg-indigo-400" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


