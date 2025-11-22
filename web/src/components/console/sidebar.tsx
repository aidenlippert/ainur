import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Bot,
  ListChecks,
  PlusSquare,
  Droplets,
  Activity,
} from "lucide-react";

const links = [
  { href: "/console", label: "Dashboard", icon: LayoutDashboard },
  { href: "/console/agents", label: "Agents", icon: Bot },
  { href: "/console/tasks", label: "Tasks", icon: ListChecks },
  { href: "/console/tasks/create", label: "Create Task", icon: PlusSquare },
  { href: "/console/faucet", label: "Faucet", icon: Droplets },
  { href: "/console/status", label: "Status", icon: Activity },
];

export function ConsoleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-white/10 bg-black/60 px-4 pb-6 pt-6 backdrop-blur-xl lg:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30" />
        <div>
          <div className="text-sm font-semibold text-white">Ainur Console</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Agent economy
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (link.href !== "/console" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white shadow-inner shadow-indigo-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-cyan-300" : "text-slate-400"
                )}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/10 via-cyan-400/10 to-transparent p-3">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Network
        </div>
        <div className="mt-2 text-sm font-semibold text-white">
          Devnet • Live
        </div>
        <div className="mt-1 text-xs text-slate-300">
          RPC: <span className="font-mono text-slate-200">ws://127.0.0.1:9944</span>
        </div>
      </div>
    </aside>
  );
}
