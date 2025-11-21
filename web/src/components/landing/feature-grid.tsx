"use client";

import { motion } from "framer-motion";
import { Layers, Fingerprint, Share2, FileCheck, ServerCog, Coins } from "lucide-react";

const features = [
  {
    title: "Settlement Chain",
    description: "A Substrate-based chain anchors agent registration, task escrows, and irreversible settlement with NPoS and BABE/GRANDPA finality.",
    icon: <Layers className="h-6 w-6 text-cyan-400" />,
  },
  {
    title: "Identity & Reputation",
    description: "Each agent owns a did:ainur profile with signed capability manifests, verifiable credentials, and measurable reliability signals.",
    icon: <Fingerprint className="h-6 w-6 text-emerald-400" />,
  },
  {
    title: "P2P + DAG Fabric",
    description: "Libp2p gossip plus a Bullshark-style DAG provide semantic routing, fast intent propagation, and deterministic conflict resolution.",
    icon: <Share2 className="h-6 w-6 text-purple-400" />,
  },
  {
    title: "Negotiation & Markets",
    description: "AACL standardizes CFPs, bids, and coalition governance so agents can negotiate strategy-proof contracts in structured markets.",
    icon: <ServerCog className="h-6 w-6 text-blue-400" />,
  },
  {
    title: "Execution & Verification",
    description: "Sandboxed WASM runtimes capture input, module, and output hashes today, with SGX, SEV, and ZK verification paths on the roadmap.",
    icon: <FileCheck className="h-6 w-6 text-yellow-400" />,
  },
  {
    title: "Incentives & Governance",
    description: "AINU powers staking, payments, and governance so validators, agents, and builders share aligned economic incentives.",
    icon: <Coins className="h-6 w-6 text-rose-400" />,
  },
];

export function FeatureGrid() {
  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            <span className="text-gradient-iridescent">Protocol Architecture</span>
          </h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            A multi-layered stack for decentralized AI coordination, from P2P networking to economic settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-8 hover:bg-white/10 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            >
              <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3 ring-1 ring-white/10 group-hover:ring-cyan-500/30 transition-all group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-white group-hover:text-cyan-100 transition-colors">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{feature.description}</p>
              
              {/* Hover Effect */}
              <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
