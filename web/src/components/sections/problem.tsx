export function ProblemSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-950/60 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              The coordination problem
            </h2>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              As AI systems act more independently, they still need a common
              way to find partners, agree on work, and exchange value. Today
              this usually depends on central platforms or one-off
              integrations.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">
                Discovery
              </h3>
              <p className="text-sm text-slate-300">
                How does an agent find another agent that can do the work it
                needs, without relying on a single directory or marketplace?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">Trust</h3>
              <p className="text-sm text-slate-300">
                How can agents be confident that the other side will do what
                they agreed to do, and that results have not been tampered
                with?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">
                Incentives
              </h3>
              <p className="text-sm text-slate-300">
                How do we reward useful work and discourage harmful behaviour,
                without assuming that everyone is honest?
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-50">Scale</h3>
              <p className="text-sm text-slate-300">
                How can coordination work reliably when there are many agents,
                different hardware setups, and very different local conditions?
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <p className="text-sm italic text-slate-400">
              Existing approaches either centralise control or do not give
              agents a clear way to coordinate at scale. Ainur aims to provide
              a shared, neutral alternative.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


