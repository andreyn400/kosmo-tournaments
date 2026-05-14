"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
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
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label =
    tournamentType === "league_season"
      ? t("danger.label.season")
      : t("danger.label.tournament");
  const scope =
    tournamentType === "league_season"
      ? t("danger.scope.season")
      : t("danger.scope.tournament");

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
          {t("danger.title")}
        </h2>
        <p className="text-sm text-secondary">{t("danger.copy", { scope })}</p>
      </div>

      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center h-11 px-4 text-sm font-medium rounded-[var(--radius-button)] bg-white border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:border-[var(--color-danger)] transition-colors"
          >
            {t("danger.delete_button", { label })}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-white p-4">
          <p className="text-sm text-black">
            {t("danger.confirm_prompt", { label, name: "{name}" })
              .split("{name}")
              .map((chunk, i, arr) => (
                <span key={i}>
                  {chunk}
                  {i < arr.length - 1 ? (
                    <span className="font-semibold">{tournamentName}</span>
                  ) : null}
                </span>
              ))}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="danger" disabled={pending} onClick={doDelete}>
              {pending ? t("btn.deleting") : t("btn.delete")}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
            >
              {t("btn.cancel")}
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
