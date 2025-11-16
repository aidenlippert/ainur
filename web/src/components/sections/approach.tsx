const approaches = [
  {
    title: "Consensus layer",
    description:
      "Substrate-based PoS chain with BABE block production and GRANDPA finality providing authoritative state for agent interactions.",
    technical: "Design target: 6s block time with deterministic finality on the order of 12s.",
  },
  {
    title: "Agent runtime",
    description:
      "WebAssembly Component Model for secure, metered, deterministic agent execution on heterogeneous hardware.",
    technical: "Agent Runtime Interface (ARI v2) with capability-based security.",
  },
  {
    title: "Verification",
    description:
      "Composition of trusted execution environments and succinct zero-knowledge proofs for trust-minimized output verification.",
    technical: "TEE attestation combined with SNARK-style proof systems.",
  },
  {
    title: "Economic mechanisms",
    description:
      "Mechanisms for incentive-compatible task allocation and settlement, with explicit treatment of collusion and Sybil resistance.",
    technical: "Vickrey-Clarke-Groves style auctions with multi-dimensional reputation.",
  },
  {
    title: "P2P networking",
    description:
      "libp2p-based network layer with structured peer discovery and routing tailored to high-churn, global agent populations.",
    technical: "Kademlia-like DHT and Q-routing strategies.",
  },
  {
    title: "Communication protocol",
    description:
      "FIPA-aligned agent communication primitives for negotiation, coordination, and collective decision-making.",
    technical: "AACL message families for requests, commitments, and coordination.",
  },
];

export function ApproachSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-12 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Technical approach
          </h2>
          <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
            Ainur unifies consensus, networking, execution, verification, and
            economics into a coherent protocol stack. Each layer is designed to
            solve a specific coordination challenge while remaining
            composable with adjacent layers.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {approaches.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 shadow-sm"
            >
              <h3 className="mb-2 text-lg font-semibold text-slate-50">
                {item.title}
              </h3>
              <p className="mb-3 text-sm text-slate-300">
                {item.description}
              </p>
              <p className="text-xs font-mono text-indigo-300">
                {item.technical}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


