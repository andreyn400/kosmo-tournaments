"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  scoringGroup,
  scoringTarget,
  validateGamesScore,
  validatePointsScore,
} from "@/lib/scoring-systems";
import type { ScoringSystem } from "@/lib/types";
import { submitScoreAction } from "./submit-score-action";

export function PointsScoreInput({
  tournamentId,
  matchId,
  scoringSystem,
  team1Players,
  team2Players,
  initialT1,
  initialT2,
  isCompleted,
  editable,
}: {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  team1Players: string;
  team2Players: string;
  initialT1: number | null;
  initialT2: number | null;
  isCompleted: boolean;
  editable: boolean;
}) {
  const [t1, setT1] = useState<string>(
    initialT1 != null ? String(initialT1) : "",
  );
  const [t2, setT2] = useState<string>(
    initialT2 != null ? String(initialT2) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const target = scoringTarget(scoringSystem);
  const isPointsGroup = scoringGroup(scoringSystem) === "points";
  const unit = isPointsGroup ? "очков" : "геймов";
  const helper = target ? `До ${target} ${unit}` : "";

  const submit = () => {
    setError(null);
    if (t1 === "" || t2 === "") {
      setError("Введите счёт для обеих команд");
      return;
    }
    const a = Number(t1);
    const b = Number(t2);
    const v = isPointsGroup
      ? validatePointsScore(scoringSystem, a, b)
      : validateGamesScore(scoringSystem, a, b);
    if (!v.ok) {
      setError(v.error);
      return;
    }

    startTransition(async () => {
      const res = await submitScoreAction({
        tournamentId,
        matchId,
        scoringSystem,
        team1Score: a,
        team2Score: b,
      });
      if (res.error) setError(res.error);
    });
  };

  const team1Won =
    isCompleted &&
    initialT1 != null &&
    initialT2 != null &&
    initialT1 > initialT2;
  const team2Won =
    isCompleted &&
    initialT1 != null &&
    initialT2 != null &&
    initialT2 > initialT1;

  return (
    <>
      {helper ? (
        <div className="px-5 pt-1 text-[10px] font-semibold text-muted uppercase tracking-[0.1em]">
          {helper}
        </div>
      ) : null}
      <div className="px-5 py-4 flex flex-col gap-3">
        <TeamRow
          name={team1Players}
          score={t1}
          onChange={setT1}
          won={team1Won}
          disabled={!editable || pending}
          inputId={`${matchId}-t1`}
        />
        <div className="text-[11px] text-fade uppercase tracking-[0.12em]">
          против
        </div>
        <TeamRow
          name={team2Players}
          score={t2}
          onChange={setT2}
          won={team2Won}
          disabled={!editable || pending}
          inputId={`${matchId}-t2`}
        />
      </div>

      {editable ? (
        <div className="px-5 pb-5 flex flex-col gap-2">
          {error ? (
            <div
              role="alert"
              className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3 py-2 text-sm"
            >
              {error}
            </div>
          ) : null}
          <Button size="lg" fullWidth disabled={pending} onClick={submit}>
            {pending
              ? "Сохранение…"
              : isCompleted
                ? "Обновить счёт"
                : "Сохранить счёт"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function TeamRow({
  name,
  score,
  onChange,
  won,
  disabled,
  inputId,
}: {
  name: string;
  score: string;
  onChange: (v: string) => void;
  won: boolean;
  disabled: boolean;
  inputId: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={inputId}
        className={`flex-1 min-w-0 truncate text-base ${
          won ? "font-bold text-black" : "text-secondary"
        }`}
      >
        {name}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={score}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="w-[80px] h-16 text-center text-2xl font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-subtle disabled:opacity-80"
      />
    </div>
  );
}
