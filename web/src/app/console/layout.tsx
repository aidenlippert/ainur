import "../globals.css";
import { ReactNode } from "react";
import { ConsoleSidebar } from "@/components/console/sidebar";
import { cn } from "@/lib/cn";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.08),transparent_35%)]" />
      {/* Subtle noise overlay without external asset to avoid 404s */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,0.15) 1px,transparent 0)] [background-size:4px_4px]" />

      <div className={cn("relative mx-auto flex max-w-7xl")}>
        <ConsoleSidebar />
        <main className="flex-1 px-4 pb-12 pt-8 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
