"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { startTournamentAction } from "./start-tournament-action";

export function StartTournamentButton({
  tournamentId,
  playerCount,
}: {
  tournamentId: string;
  playerCount: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isReady = playerCount >= 4 && playerCount % 4 === 0;

  const start = () => {
    setError(null);
    startTransition(async () => {
      const res = await startTournamentAction(tournamentId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        disabled={!isReady || pending}
        onClick={start}
        title={
          isReady
            ? "Сгенерировать расписание и начать матчи"
            : "Число игроков должно быть кратно 4 (и не менее 4)"
        }
      >
        {pending ? "Запуск…" : "Начать турнир"}
      </Button>
      {!isReady ? (
        <p className="text-xs text-muted">
          Игроков: {playerCount}. Нужно кратное 4 число (минимум 4).
        </p>
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
