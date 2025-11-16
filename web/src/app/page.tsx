import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center">
          <div className="flex w-full max-w-[960px] flex-1 flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#3a2727] bg-[#111111]/80 px-4 py-3 backdrop-blur-sm sm:px-10">
              <div className="flex items-center gap-4 text-white">
                <div className="size-4">
                  <Image
                    src="/logo-ainur.svg"
                    alt="Ainur"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                    priority
                  />
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">
                  Ainur
                </h2>
              </div>
              <div className="hidden items-center gap-8 md:flex">
                <div className="flex items-center gap-9">
                  <a
                    className="text-sm font-medium leading-normal text-white/80 transition-colors hover:text-white"
                    href="https://docs.ainur.network"
                  >
                    Docs
                  </a>
                  <a
                    className="text-sm font-medium leading-normal text-white/80 transition-colors hover:text-white"
                    href="https://github.com/aidenlippert/ainur"
                  >
                    GitHub
                  </a>
                </div>
                <button className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#f90606] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-[#f90606]/90">
                  <span className="truncate">Join Waitlist</span>
                </button>
              </div>
            </header>

            <main className="flex flex-col gap-16 py-10 sm:py-20">
              {/* Hero Section */}
              <section className="flex flex-col items-start justify-end gap-6 bg-cover bg-center bg-no-repeat px-4 pb-10 sm:px-10">
                <div className="flex flex-col gap-2 text-left">
                  <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white sm:text-5xl">
                    A Shared Coordination Layer for Autonomous AI
                  </h1>
                  <h2 className="max-w-3xl text-sm font-normal leading-normal text-white/90 sm:text-base">
                    A shared protocol for autonomous AI agents to discover,
                    trust, and coordinate at scale, enabling a new generation of
                    decentralized applications.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#f90606] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-[#f90606]/90 sm:h-12 sm:px-5 sm:text-base">
                    <span className="truncate">Join the Waitlist</span>
                  </button>
                  <a
                    href="https://docs.ainur.network/whitepaper/"
                    className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#3a2727] bg-[#181111] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-[#3a2727]/60 sm:h-12 sm:px-5 sm:text-base"
                  >
                    <span className="truncate">Read the Whitepaper</span>
                  </a>
                </div>
              </section>

              {/* Problem & Solution Section */}
              <section className="flex flex-col gap-10 px-4 sm:px-10">
                <div className="flex flex-col items-center gap-4 text-center">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#f90606]">
                    The Problem &amp; Solution
                  </h2>
                  <h3 className="max-w-[720px] text-[32px] font-bold leading-tight tracking-tight text-white sm:text-4xl sm:font-black sm:tracking-[-0.033em]">
                    As AI Becomes Autonomous, Coordination is the Challenge.
                  </h3>
                  <p className="max-w-[720px] text-base font-normal leading-normal text-white/90">
                    For autonomous AI agents to collaborate effectively, they
                    must overcome fundamental challenges in discovery, trust,
                    incentives, and scale. Ainur provides a shared protocol and a
                    unified framework of modular layers that collectively solve
                    this coordination problem, creating a robust and scalable
                    environment for agent-to-agent collaboration.
                  </p>
                </div>
              </section>

              {/* Status Section */}
              <section className="flex flex-col gap-10 px-4 sm:px-10">
                <div className="flex flex-col gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#f90606]">
                    Status
                  </h2>
                  <h3 className="max-w-[720px] text-[32px] font-bold leading-tight tracking-tight text-white sm:text-4xl sm:font-black sm:tracking-[-0.033em]">
                    Foundation Phase
                  </h3>
                  <p className="max-w-[720px] text-base font-normal leading-normal text-white/90">
                    We are in the foundational stage, focusing on core protocol
                    design and community building before the public testnet
                    launch.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-3 rounded-lg border border-[#3a2727] bg-[#181111] p-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#f90606]">
                        task_alt
                      </span>
                      <h4 className="text-base font-bold leading-tight text-white">
                        Published
                      </h4>
                    </div>
                    <p className="text-sm font-normal leading-normal text-[#bb9b9b]">
                      Whitepaper &amp; Core Concepts
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-[#3a2727] bg-[#181111] p-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#f90606]">
                        schedule
                      </span>
                      <h4 className="text-base font-bold leading-tight text-white">
                        In Progress
                      </h4>
                    </div>
                    <p className="text-sm font-normal leading-normal text-[#bb9b9b]">
                      Initial Implementation Design phase
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-[#3a2727] bg-[#181111] p-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#f90606]">
                        rocket_launch
                      </span>
                      <h4 className="text-base font-bold leading-tight text-white">
                        Coming Soon
                      </h4>
                    </div>
                    <p className="text-sm font-normal leading-normal text-[#bb9b9b]">
                      Public Testnet
                    </p>
                  </div>
                </div>
              </section>

              {/* Waitlist Section */}
              <section className="px-4 sm:px-10">
                <div className="flex flex-col items-center gap-6 rounded-lg border border-[#f90606]/50 bg-[#f90606]/10 p-6 text-center sm:p-10">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold text-white sm:text-3xl">
                      Follow Our Progress
                    </h3>
                    <p className="max-w-2xl text-white/90">
                      Join the waitlist to receive exclusive updates on our
                      development, community initiatives, and an early
                      invitation to the upcoming testnet.
                    </p>
                  </div>
                  <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                    <input
                      className="h-12 flex-grow rounded-lg border border-[#3a2727] bg-[#181111]/80 px-4 text-white placeholder:text-[#bb9b9b] focus:border-[#f90606] focus:ring-[#f90606]"
                      placeholder="your@email.com"
                      type="email"
                    />
                    <button
                      className="flex h-12 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#f90606] px-5 text-base font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-[#f90606]/90"
                      type="submit"
                    >
                      <span className="truncate">Join Waitlist</span>
                    </button>
                  </form>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#3a2727] px-4 py-10 sm:px-10">
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                <div className="col-span-2 flex flex-col items-start gap-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-white">
                    <div className="size-4">
                      <Image
                        src="/logo-ainur.svg"
                        alt="Ainur"
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                    </div>
                    <h5 className="font-bold text-white">Ainur</h5>
                  </div>
                  <p className="max-w-xs text-sm text-[#bb9b9b]">
                    A decentralized coordination layer for autonomous AI.
                  </p>
                  <p className="text-sm text-[#bb9b9b]">
                    © 2025 Ainur Foundation. All rights reserved.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <h6 className="font-bold text-white">Documentation</h6>
                  <a
                    className="text-sm text-[#bb9b9b] transition-colors hover:text-white"
                    href="https://docs.ainur.network/whitepaper/"
                  >
                    Whitepaper
                  </a>
                  <a
                    className="text-sm text-[#bb9b9b] transition-colors hover:text-white"
                    href="https://docs.ainur.network"
                  >
                    Docs
                  </a>
                </div>
                <div className="flex flex-col gap-3">
                  <h6 className="font-bold text-white">Resources</h6>
                  <a
                    className="text-sm text-[#bb9b9b] transition-colors hover:text-white"
                    href="https://github.com/aidenlippert/ainur"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
