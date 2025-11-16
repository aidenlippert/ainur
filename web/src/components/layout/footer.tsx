export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 text-sm text-slate-300 md:grid-cols-4">
          <div>
            <div className="mb-3 text-base font-semibold text-slate-50">
              Ainur Protocol
            </div>
            <p className="text-xs text-slate-400">
              Decentralised infrastructure for AI agent coordination under
              adversarial and heterogeneous conditions.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Documentation
            </div>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://docs.ainur.network"
                  className="text-slate-300 hover:text-slate-50"
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="https://docs.ainur.network/architecture-structure/overview/"
                  className="text-slate-300 hover:text-slate-50"
                >
                  Architecture
                </a>
              </li>
              <li>
                <a
                  href="https://docs.ainur.network/architecture/technical-specifications/"
                  className="text-slate-300 hover:text-slate-50"
                >
                  Technical specifications
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Resources
            </div>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://docs.ainur.network/whitepaper/"
                  className="text-slate-300 hover:text-slate-50"
                >
                  Whitepaper
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aidenlippert/ainur"
                  className="text-slate-300 hover:text-slate-50"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Contact
            </div>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="mailto:contact@ainur.network"
                  className="text-slate-300 hover:text-slate-50"
                >
                  contact@ainur.network
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-center text-[11px] text-slate-500">
          © 2025 Ainur Protocol. Apache 2.0 / MIT dual licence.
        </div>
      </div>
    </footer>
  );
}


