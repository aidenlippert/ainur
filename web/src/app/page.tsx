export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="hero-panel w-full max-w-xl rounded-[32px] border border-slate-800/80 bg-slate-950/80 px-6 py-10 shadow-[0_40px_140px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:px-10 sm:py-14">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Ainur Protocol · Waitlist
            </div>
            <h1 className="bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Ainur
            </h1>
            <p className="mt-2 text-sm font-light uppercase tracking-[0.25em] text-slate-300 sm:text-base">
              planetary ai
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              A shared coordination layer for autonomous AI agents. Join the mailing
              list to receive protocol updates and the public testnet announcement.
            </p>

            <form
              name="waitlist"
              method="POST"
              data-netlify="true"
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row"
            >
              <input type="hidden" name="form-name" value="waitlist" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-full border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                placeholder="you@example.com"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_60px_rgba(15,23,42,0.9)] transition hover:bg-slate-200 sm:w-auto"
              >
                Join mailing list
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <a
                href="/whitepaper"
                className="inline-flex items-center justify-center rounded-full border border-slate-500 bg-slate-900/90 px-6 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-50"
              >
                Read the whitepaper
              </a>
              <p className="text-[0.7rem] text-slate-500">
                No token sale. No investment product. Protocol infrastructure under
                active development.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
