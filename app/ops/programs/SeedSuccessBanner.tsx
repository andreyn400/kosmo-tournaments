"use client";

import { useEffect } from "react";
import { useTranslation } from "@/components/i18n/useTranslation";

interface SeedSuccessBannerProps {
  count: number;
  onDismiss: () => void;
}

export function SeedSuccessBanner({
  count,
  onDismiss,
}: SeedSuccessBannerProps) {
  const { t, tPlural } = useTranslation();

  useEffect(() => {
    const tm = setTimeout(onDismiss, 6000);
    return () => clearTimeout(tm);
  }, [onDismiss]);

  const word = tPlural(count, {
    one: "programs.progs.one",
    few: "programs.progs.few",
    many: "programs.progs.many",
  });

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
        {count} {word} {t("programs.seed.success_suffix")}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("nav.close_menu")}
        className="text-[var(--color-success)]/80 hover:text-[var(--color-success)] text-xl leading-none px-1 -my-2 -mr-1"
      >
        ×
      </button>
    </div>
  );
}
