import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

type StepState = "done" | "active" | "pending";

export type Step = {
  title: string;
  description?: string;
  ts?: string;
  state?: StepState;
};

type Props = {
  steps: Step[];
  className?: string;
};

// Simple progress track used across onboarding and task views.
export function StepTrack({ steps, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-4 rounded-2xl border border-white/10 bg-black/40 p-3",
        className
      )}
    >
      {steps.map((step, idx) => {
        const state = step.state ?? "pending";
        const isActive = state === "active";
        const isDone = state === "done";

        return (
          <motion.div
            key={step.title}
            whileHover={{ y: -2 }}
            className={cn(
              "relative rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur",
              isActive && "border-cyan-400/50 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]",
              isDone && "border-white/15"
            )}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/40 font-semibold text-[11px]",
                  isActive && "border-cyan-300/70 text-cyan-100",
                  isDone && "border-emerald-300/70 text-emerald-100"
                )}
              >
                {idx + 1}
              </span>
              {step.title}
            </div>
            {(step.description || step.ts) && (
              <div className="mt-1 text-xs text-slate-300">
                {step.description ?? step.ts}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
