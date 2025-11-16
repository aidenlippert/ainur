"use client";

import { useEffect, useState } from "react";

interface NumberTickerProps {
  value: number;
  durationMs?: number;
}

export function NumberTicker({
  value,
  durationMs = 1000,
}: NumberTickerProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span>{display.toLocaleString()}</span>;
}


