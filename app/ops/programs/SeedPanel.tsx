"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PEAK_LABEL } from "@/lib/program-groups";
import { seedProgramsAction } from "./seed-programs-action";

interface SeedPanelProps {
  onSeeded?: (count: number) => void;
}

export function SeedPanel({ onSeeded }: SeedPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runSeed() {
    if (
      !confirm(
        "Загрузить 129 программ из padel-ops? Это можно сделать только когда библиотека пуста.",
      )
    )
      return;
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
          Библиотека программ пуста
        </h2>
        <p className="text-sm text-muted mt-1 max-w-md mx-auto">
          Загрузите 129 программ из padel-ops с реальными ценами, длительностью
          и количеством игроков. Пик — {PEAK_LABEL}.
        </p>
      </div>
      <Button onClick={runSeed} disabled={pending}>
        {pending ? "Загрузка…" : "Загрузить программы из padel-ops"}
      </Button>
      <p className="text-[11px] text-muted">
        Или создайте программу вручную в любой группе ниже.
      </p>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
