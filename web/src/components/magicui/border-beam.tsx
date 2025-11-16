"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface BorderBeamProps {
  className?: string;
  duration?: number;
}

export function BorderBeam({
  className,
  duration = 12,
}: BorderBeamProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-md border border-transparent",
        className
      )}
      style={{
        background:
          "conic-gradient(from 0deg, transparent, rgba(129, 140, 248, 0.6), transparent)",
      }}
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        ease: "linear",
        duration,
      }}
    />
  );
}


