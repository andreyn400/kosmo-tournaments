"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { startDivisionAction } from "./start-division-action";

export type CourtConflict = {
  courtNumber: number | null;
  divisionName: string;
};

export function StartDivisionButton({
  tournamentId,
  divisionId,
  playerCount,
  courtConflicts,
}: {
  tournamentId: string;
  divisionId: string;
  playerCount: number;
  courtConflicts: CourtConflict[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasConflict = courtConflicts.length > 0;
  const playerCountOk = playerCount >= 4 && playerCount % 4 === 0;
  const canStart = playerCountOk && !hasConflict;

  const start = () => {
    setError(null);
    startTransition(async () => {
      const res = await startDivisionAction({ tournamentId, divisionId });
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" disabled={!canStart || pending} onClick={start}>
        {pending ? "Запуск…" : "Начать дивизион"}
      </Button>
      {!playerCountOk ? (
        <p className="text-xs text-muted">
          Игроков: {playerCount}. Нужно кратное 4 число (минимум 4).
        </p>
      ) : null}
      {hasConflict ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm flex flex-col gap-1"
        >
          {courtConflicts.map((c, idx) => (
            <div key={idx}>
              Невозможно запустить: Корт{" "}
              {c.courtNumber !== null ? `К${c.courtNumber}` : "?"} уже
              используется дивизионом «{c.divisionName}». Выберите другие
              корты для этого дивизиона.
            </div>
          ))}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
