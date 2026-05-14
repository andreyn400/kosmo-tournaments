"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { PEAK_LABEL } from "@/lib/program-groups";
import { seedProgramsAction } from "./seed-programs-action";

interface SeedPanelProps {
  onSeeded?: (count: number) => void;
}

export function SeedPanel({ onSeeded }: SeedPanelProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runSeed() {
    if (!confirm(t("programs.seed.confirm"))) return;
    setError(null);
    startTransition(async () => {
      const res = await seedProgramsAction();
      if (res.error) {
        setError(res.error);
        return;
      }
      onSeeded?.(res.inserted ?? 0);
      router.refresh();
    });
  }

  return (
    <div className="rounded-card border border-dashed border-border bg-surface p-6 flex flex-col items-center gap-3 text-center">
      <div>
        <h2 className="text-base font-semibold text-black">
          {t("programs.empty.library_title")}
        </h2>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">
          {t("programs.empty.library_copy", { window: PEAK_LABEL })}
        </p>
      </div>
      <Button onClick={runSeed} disabled={pending}>
        {pending ? t("programs.seed.loading") : t("programs.seed.cta")}
      </Button>
      <p className="text-[11px] text-muted">
        {t("programs.empty.manual_hint")}
      </p>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
