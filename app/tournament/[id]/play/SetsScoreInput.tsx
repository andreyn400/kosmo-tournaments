"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  setsWon,
  validateSetsScore,
  type SetsDetail,
} from "@/lib/scoring-systems";
import type { ScoringSystem } from "@/lib/types";
import { submitScoreAction } from "./submit-score-action";

export function SetsScoreInput({
  tournamentId,
  divisionId,
  matchId,
  scoringSystem,
  team1Players,
  team2Players,
  initial,
  isCompleted,
  editable,
}: {
  tournamentId: string;
  divisionId?: string | null;
  matchId: string;
  scoringSystem: ScoringSystem;
  team1Players: string;
  team2Players: string;
  initial: SetsDetail | null;
  isCompleted: boolean;
  editable: boolean;
}) {
  const { t } = useTranslation();
  const [s1a, setS1a] = useState<string>(
    initial?.sets[0]?.[0] != null ? String(initial.sets[0][0]) : "",
  );
  const [s1b, setS1b] = useState<string>(
    initial?.sets[0]?.[1] != null ? String(initial.sets[0][1]) : "",
  );
  const [s2a, setS2a] = useState<string>(
    initial?.sets[1]?.[0] != null ? String(initial.sets[1][0]) : "",
  );
  const [s2b, setS2b] = useState<string>(
    initial?.sets[1]?.[1] != null ? String(initial.sets[1][1]) : "",
  );
  const [s3a, setS3a] = useState<string>(() => {
    if (!initial) return "";
    if (scoringSystem === "sets_supertiebreak" && initial.supertiebreak) {
      return String(initial.supertiebreak[0]);
    }
    if (initial.sets[2]) return String(initial.sets[2][0]);
    return "";
  });
  const [s3b, setS3b] = useState<string>(() => {
    if (!initial) return "";
    if (scoringSystem === "sets_supertiebreak" && initial.supertiebreak) {
      return String(initial.supertiebreak[1]);
    }
    if (initial.sets[2]) return String(initial.sets[2][1]);
    return "";
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set1Filled = s1a !== "" && s1b !== "";
  const set2Filled = s2a !== "" && s2b !== "";
  const t1Wins =
    (set1Filled && Number(s1a) > Number(s1b) ? 1 : 0) +
    (set2Filled && Number(s2a) > Number(s2b) ? 1 : 0);
  const t2Wins =
    (set1Filled && Number(s1b) > Number(s1a) ? 1 : 0) +
    (set2Filled && Number(s2b) > Number(s2a) ? 1 : 0);
  const needsThirdRow =
    set1Filled && set2Filled && t1Wins === 1 && t2Wins === 1;

  const thirdLabel =
    scoringSystem === "sets_supertiebreak"
      ? t("match.field.supertiebreak_to_10")
      : t("match.field.deciding_set");

  const submit = () => {
    setError(null);
    if (!set1Filled || !set2Filled) {
      setError(t("match.error.enter_first_two"));
      return;
    }
    const detail: SetsDetail = {
      sets: [
        [Number(s1a), Number(s1b)],
        [Number(s2a), Number(s2b)],
      ],
    };
    if (needsThirdRow) {
      if (s3a === "" || s3b === "") {
        setError(t("match.error.enter_label", { label: thirdLabel }));
        return;
      }
      if (scoringSystem === "sets_supertiebreak") {
        detail.supertiebreak = [Number(s3a), Number(s3b)];
      } else {
        detail.sets.push([Number(s3a), Number(s3b)]);
      }
    }

    const v = validateSetsScore(scoringSystem, detail);
    if (!v.ok) {
      setError(t(v.error.key, v.error.vars));
      return;
    }

    startTransition(async () => {
      const res = await submitScoreAction({
        tournamentId,
        divisionId: divisionId ?? null,
        matchId,
        scoringSystem,
        scoreDetail: detail,
      });
      if (res.error) setError(res.error);
    });
  };

  const wonArr = isCompleted && initial ? setsWon(initial) : null;
  const team1Won = wonArr ? wonArr[0] > wonArr[1] : false;
  const team2Won = wonArr ? wonArr[1] > wonArr[0] : false;
  const courtPrefix = t("court.prefix");

  return (
    <>
      <div className="px-5 pt-3 grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 items-baseline text-[11px] font-semibold text-muted uppercase tracking-[0.08em]">
        <span></span>
        <span className="w-[60px] text-center text-secondary">
          {courtPrefix}1
        </span>
        <span className="w-[60px] text-center text-secondary">
          {courtPrefix}2
        </span>
      </div>
      <div className="px-5 pt-1 grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 items-center">
        <span
          className={`text-sm truncate ${team1Won ? "font-bold text-black" : "text-secondary"}`}
          title={team1Players}
        >
          {team1Players}
        </span>
        <span className="w-[60px]"></span>
        <span className="w-[60px]"></span>

        <span
          className={`text-sm truncate ${team2Won ? "font-bold text-black" : "text-secondary"}`}
          title={team2Players}
        >
          {team2Players}
        </span>
        <span className="w-[60px]"></span>
        <span className="w-[60px]"></span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <SetRow
          label={t("match.field.set1")}
          a={s1a}
          b={s1b}
          onA={setS1a}
          onB={setS1b}
          disabled={!editable || pending}
          idA={`${matchId}-s1a`}
          idB={`${matchId}-s1b`}
          maxLen={2}
        />
        <SetRow
          label={t("match.field.set2")}
          a={s2a}
          b={s2b}
          onA={setS2a}
          onB={setS2b}
          disabled={!editable || pending}
          idA={`${matchId}-s2a`}
          idB={`${matchId}-s2b`}
          maxLen={2}
        />
        {needsThirdRow ? (
          <SetRow
            label={thirdLabel}
            a={s3a}
            b={s3b}
            onA={setS3a}
            onB={setS3b}
            disabled={!editable || pending}
            idA={`${matchId}-s3a`}
            idB={`${matchId}-s3b`}
            maxLen={scoringSystem === "sets_supertiebreak" ? 3 : 2}
          />
        ) : null}
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
              ? t("match.saving")
              : isCompleted
                ? t("match.update_score")
                : t("match.save_score")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function SetRow({
  label,
  a,
  b,
  onA,
  onB,
  disabled,
  idA,
  idB,
  maxLen,
}: {
  label: string;
  a: string;
  b: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
  disabled: boolean;
  idA: string;
  idB: string;
  maxLen: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
      <label htmlFor={idA} className="text-xs text-muted">
        {label}
      </label>
      <input
        id={idA}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxLen}
        value={a}
        disabled={disabled}
        onChange={(e) => onA(e.target.value.replace(/\D/g, ""))}
        className="w-[60px] h-12 text-center text-xl font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-subtle disabled:opacity-80"
      />
      <input
        id={idB}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxLen}
        value={b}
        disabled={disabled}
        onChange={(e) => onB(e.target.value.replace(/\D/g, ""))}
        className="w-[60px] h-12 text-center text-xl font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-subtle disabled:opacity-80"
      />
    </div>
  );
}
