"use client";

import { cn } from "@/lib/cn";

interface AnimatedGridPatternProps {
  className?: string;
}

export function AnimatedGridPattern({
  className,
}: AnimatedGridPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1f2937_1px,transparent_0)] [background-size:24px_24px] opacity-60",
        className
      )}
    />
  );
}


