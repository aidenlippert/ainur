import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

export type Accent = "violet" | "cyan" | "emerald" | "amber" | "slate";

type Props = {
  label: string;
  value: string;
  helper?: string;
  delta?: string;
  accent?: Accent;
  className?: string;
};

// Compact stat card used on the console dashboard.
export function MetricCard({
  label,
  value,
  helper,
  delta,
  accent = "slate",
  className,
}: Props) {
  const accentMap: Record<Accent, string> = {
    violet: "from-indigo-500/20 to-purple-500/10",
    cyan: "from-cyan-500/20 to-sky-500/10",
    emerald: "from-emerald-500/20 to-lime-500/10",
    amber: "from-amber-400/25 to-orange-500/10",
    slate: "from-white/5 to-white/0",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, translateY: -2 }}
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br p-4 backdrop-blur",
        accentMap[accent],
        className
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {helper && <div className="text-sm text-slate-300">{helper}</div>}
      {delta && <div className="text-xs text-cyan-200">{delta}</div>}
    </motion.div>
  );
}
