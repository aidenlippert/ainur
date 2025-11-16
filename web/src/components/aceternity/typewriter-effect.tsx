"use client";

import { useEffect, useState } from "react";

interface WordSpec {
  text: string;
  className?: string;
}

interface TypewriterEffectProps {
  words: WordSpec[];
  typingDelayMs?: number;
}

export function TypewriterEffect({
  words,
  typingDelayMs = 45,
}: TypewriterEffectProps) {
  const [visibleChars, setVisibleChars] = useState(0);

  const fullText = words.map((w) => w.text).join(" ");

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= fullText.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, typingDelayMs);

    return () => clearInterval(interval);
  }, [fullText, typingDelayMs]);

  const currentSlice = fullText.slice(0, visibleChars);

  // Render slice against original word boundaries to preserve styling.
  let consumed = 0;
  const segments: Array<{ text: string; className?: string; key: string }> =
    [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const segmentLength = Math.min(
      Math.max(currentSlice.length - consumed, 0),
      word.text.length + (i > 0 ? 1 : 0)
    );
    if (segmentLength <= 0) break;
    const segmentText = currentSlice.slice(consumed, consumed + segmentLength);
    consumed += segmentLength;
    segments.push({
      text: segmentText,
      className: word.className,
      key: `${i}-${segmentText}`,
    });
  }

  return (
    <span className="inline-flex flex-wrap justify-center gap-x-1">
      {segments.map((seg) => (
        <span key={seg.key} className={seg.className}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}


