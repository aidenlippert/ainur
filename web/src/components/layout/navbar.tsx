import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-ainur.svg" alt="Ainur" width={32} height={32} />
          <span className="text-sm font-semibold text-white">Ainur Protocol</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-200">
          <Link href="/console" className="hover:text-white">
            Launch console
          </Link>
          <a
            href="https://docs.ainur.network"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            Docs
          </a>
          <a
            href="https://github.com/aidenlippert/ainur"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs hover:border-white/30"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
