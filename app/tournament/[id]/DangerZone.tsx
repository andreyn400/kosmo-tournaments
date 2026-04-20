"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { TournamentType } from "@/lib/types";
import { deleteTournamentAction } from "./delete-tournament-action";

export function DangerZone({
  tournamentId,
  tournamentName,
  tournamentType,
}: {
  tournamentId: string;
  tournamentName: string;
  tournamentType: TournamentType;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label = tournamentType === "league_season" ? "лигу" : "турнир";

  const doDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteTournamentAction(tournamentId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div
      className="mt-4 flex flex-col gap-3 rounded-[var(--radius-card)] p-6"
      style={{
        border: "1px solid #fecaca",
        background: "#fff5f5",
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-[var(--color-danger)]">
          Опасная зона
        </h2>
        <p className="text-sm text-secondary">
          Удаление необратимо: будут удалены сессии, раунды, матчи, регистрации и
          история рейтингов, связанные с этим{" "}
          {tournamentType === "league_season" ? "сезоном" : "турниром"}.
        </p>
      </div>

      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center h-11 px-4 text-sm font-medium rounded-[var(--radius-button)] bg-white border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:border-[var(--color-danger)] transition-colors"
          >
            Удалить {label}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-white p-4">
          <p className="text-sm text-black">
            Удалить {label}{" "}
            <span className="font-semibold">{tournamentName}</span>? Все данные
            будут удалены без возможности восстановления.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="danger" disabled={pending} onClick={doDelete}>
              {pending ? "Удаление…" : "Удалить"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
            >
              Отмена
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
