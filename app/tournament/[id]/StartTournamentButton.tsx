"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { startTournamentAction } from "./start-tournament-action";

export function StartTournamentButton({
  tournamentId,
  playerCount,
}: {
  tournamentId: string;
  playerCount: number;
}) {
  const { t } = useTranslation();
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
            ? t("start_tournament.ready_title")
            : t("start_tournament.not_ready_title")
        }
      >
        {pending ? t("start_tournament.starting") : t("start_tournament.cta")}
      </Button>
      {!isReady ? (
        <p className="text-xs text-muted">
          {t("start_tournament.not_ready_hint", { n: playerCount })}
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
