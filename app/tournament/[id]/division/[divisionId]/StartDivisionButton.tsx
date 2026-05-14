"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
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
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasConflict = courtConflicts.length > 0;
  const playerCountOk = playerCount >= 4 && playerCount % 4 === 0;
  const canStart = playerCountOk && !hasConflict;
  const courtPrefix = t("court.prefix");

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
        {pending ? t("start_division.starting") : t("start_division.cta")}
      </Button>
      {!playerCountOk ? (
        <p className="text-xs text-muted">
          {t("start_division.not_ready_hint", { n: playerCount })}
        </p>
      ) : null}
      {hasConflict ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm flex flex-col gap-1"
        >
          <div className="font-semibold">
            {t("start_division.conflict_prefix")}
          </div>
          {courtConflicts.map((c, idx) => (
            <div key={idx}>
              {t("start_division.conflict_line", {
                courtLabel:
                  c.courtNumber !== null
                    ? `${courtPrefix}${c.courtNumber}`
                    : "?",
                name: c.divisionName,
              })}
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
