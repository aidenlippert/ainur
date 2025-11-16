import { Button } from "@/components/ui/button";

export function ArchitectureSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950/70 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Protocol architecture
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            A multi-layer design separating concerns while enabling cross-layer
            optimisation and verifiable end-to-end behaviour.
          </p>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {[
            [
              "Economic layer",
              "VCG-style auctions, reputation, and tokenomics for task allocation and settlement.",
            ],
            [
              "Verification layer",
              "Trusted execution and zero-knowledge proofs for verifiable computation.",
            ],
            [
              "Runtime layer",
              "WASM-based agent execution environments with explicit resource metering.",
            ],
            [
              "Communication layer",
              "AACL message protocols for negotiation and coordination.",
            ],
            [
              "Network layer",
              "libp2p-based overlay with structured peer discovery and routing.",
            ],
            [
              "Consensus layer",
              "Substrate-based BFT state machine as temporal anchor.",
            ],
          ].map(([title, desc]) => (
            <div
              key={title as string}
              className="rounded border border-slate-800 bg-slate-950/80 p-4 text-left"
            >
              <div className="text-sm font-semibold text-slate-50">
                {title}
              </div>
              <div className="mt-1 text-xs text-slate-300 sm:text-sm">
                {desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="px-6 text-sm sm:text-base"
          >
            <a href="https://docs.ainur.network/architecture/technical-specifications/">
              View complete specification
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}


