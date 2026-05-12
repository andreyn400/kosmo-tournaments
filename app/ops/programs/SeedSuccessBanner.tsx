"use client";

import { useEffect } from "react";

interface SeedSuccessBannerProps {
  count: number;
  onDismiss: () => void;
}

export function SeedSuccessBanner({
  count,
  onDismiss,
}: SeedSuccessBannerProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="rounded-card border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-4 py-3 flex items-center gap-3"
    >
      <span
        aria-hidden
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)] text-white text-xs font-bold flex-shrink-0"
      >
        ✓
      </span>
      <p className="text-sm text-[var(--color-success)] font-medium flex-1">
        {count}{" "}
        {pluralProgs(count)} загружено из padel-ops.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Закрыть"
        className="text-[var(--color-success)]/80 hover:text-[var(--color-success)] text-xl leading-none px-1 -my-2 -mr-1"
      >
        ×
      </button>
    </div>
  );
}

function pluralProgs(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "программ";
  if (mod10 === 1) return "программа";
  if (mod10 >= 2 && mod10 <= 4) return "программы";
  return "программ";
}
