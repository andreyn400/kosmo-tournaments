"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  scoringGroup,
  scoringTarget,
  setsWon,
  validateCombinedScore,
  validateGamesScore,
  validatePointsScore,
  validateSetsScore,
  type SetsDetail,
} from "@/lib/scoring-systems";
import type { ScoringSystem } from "@/lib/types";
import { submitBracketScoreAction } from "./submit-bracket-action";

export function BracketScoreInput({
  tournamentId,
  matchId,
  scoringSystem,
  initial,
  initialT1,
  initialT2,
  onDone,
  onCancel,
}: {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  initial: SetsDetail | null;
  initialT1: number | null;
  initialT2: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const group = scoringGroup(scoringSystem);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (group === "sets") {
    return (
      <SetsEntry
        tournamentId={tournamentId}
        matchId={matchId}
        scoringSystem={scoringSystem}
        initial={initial}
        onCancel={onCancel}
        onDone={onDone}
        error={error}
        setError={setError}
        pending={pending}
        startTransition={startTransition}
      />
    );
  }

  return (
    <PointsOrGamesEntry
      tournamentId={tournamentId}
      matchId={matchId}
      scoringSystem={scoringSystem}
      initialT1={initialT1}
      initialT2={initialT2}
      onCancel={onCancel}
      onDone={onDone}
      error={error}
      setError={setError}
      pending={pending}
      startTransition={startTransition}
    />
  );
}

function PointsOrGamesEntry({
  tournamentId,
  matchId,
  scoringSystem,
  initialT1,
  initialT2,
  onCancel,
  onDone,
  error,
  setError,
  pending,
  startTransition,
}: {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  initialT1: number | null;
  initialT2: number | null;
  onCancel: () => void;
  onDone: () => void;
  error: string | null;
  setError: (v: string | null) => void;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const { t } = useTranslation();
  const [t1, setT1] = useState<string>(initialT1 != null ? String(initialT1) : "");
  const [t2, setT2] = useState<string>(initialT2 != null ? String(initialT2) : "");
  const target = scoringTarget(scoringSystem);
  const group = scoringGroup(scoringSystem);
  const unit =
    group === "points"
      ? t("match.unit.points")
      : group === "combined"
        ? t("match.unit.combined")
        : t("match.unit.games");
  const helper = target
    ? t("match.helper.target_with_unit", { target, unit })
    : "";

  const submit = () => {
    setError(null);
    if (t1 === "" || t2 === "") {
      setError(t("match.error.enter_both"));
      return;
    }
    const a = Number(t1);
    const b = Number(t2);
    const v =
      group === "points"
        ? validatePointsScore(scoringSystem, a, b)
        : group === "combined"
          ? validateCombinedScore(scoringSystem, a, b)
          : validateGamesScore(scoringSystem, a, b);
    if (!v.ok) {
      setError(t(v.error.key, v.error.vars));
      return;
    }
    if (a === b) {
      setError(t("finals.bracket.no_tie"));
      return;
    }
    startTransition(async () => {
      const res = await submitBracketScoreAction({
        tournamentId,
        matchId,
        scoringSystem,
        team1Score: a,
        team2Score: b,
      });
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {helper ? <p className="text-xs text-muted">{helper}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <ScoreBox
          label={t("finals.bracket.team_1")}
          value={t1}
          onChange={setT1}
          disabled={pending}
        />
        <ScoreBox
          label={t("finals.bracket.team_2")}
          value={t2}
          onChange={setT2}
          disabled={pending}
        />
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-2.5 py-1.5 text-xs"
        >
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? t("match.saving") : t("btn.save")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel} disabled={pending}>
          {t("btn.cancel")}
        </Button>
      </div>
    </div>
  );
}

function SetsEntry({
  tournamentId,
  matchId,
  scoringSystem,
  initial,
  onCancel,
  onDone,
  error,
  setError,
  pending,
  startTransition,
}: {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  initial: SetsDetail | null;
  onCancel: () => void;
  onDone: () => void;
  error: string | null;
  setError: (v: string | null) => void;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const { t } = useTranslation();
  const [s1a, setS1a] = useState(
    initial?.sets[0]?.[0] != null ? String(initial.sets[0][0]) : "",
  );
  const [s1b, setS1b] = useState(
    initial?.sets[0]?.[1] != null ? String(initial.sets[0][1]) : "",
  );
  const [s2a, setS2a] = useState(
    initial?.sets[1]?.[0] != null ? String(initial.sets[1][0]) : "",
  );
  const [s2b, setS2b] = useState(
    initial?.sets[1]?.[1] != null ? String(initial.sets[1][1]) : "",
  );
  const [s3a, setS3a] = useState(() => {
    if (!initial) return "";
    if (scoringSystem === "sets_supertiebreak" && initial.supertiebreak) {
      return String(initial.supertiebreak[0]);
    }
    if (initial.sets[2]) return String(initial.sets[2][0]);
    return "";
  });
  const [s3b, setS3b] = useState(() => {
    if (!initial) return "";
    if (scoringSystem === "sets_supertiebreak" && initial.supertiebreak) {
      return String(initial.supertiebreak[1]);
    }
    if (initial.sets[2]) return String(initial.sets[2][1]);
    return "";
  });

  const set1Filled = s1a !== "" && s1b !== "";
  const set2Filled = s2a !== "" && s2b !== "";
  const t1Wins =
    (set1Filled && Number(s1a) > Number(s1b) ? 1 : 0) +
    (set2Filled && Number(s2a) > Number(s2b) ? 1 : 0);
  const t2Wins =
    (set1Filled && Number(s1b) > Number(s1a) ? 1 : 0) +
    (set2Filled && Number(s2b) > Number(s2a) ? 1 : 0);
  const needsThird = set1Filled && set2Filled && t1Wins === 1 && t2Wins === 1;
  const thirdLabel =
    scoringSystem === "sets_supertiebreak"
      ? t("match.field.supertiebreak")
      : t("match.field.set3");

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
    if (needsThird) {
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
    const [a, b] = setsWon(detail);
    if (a === b) {
      setError(t("finals.bracket.no_tie"));
      return;
    }
    startTransition(async () => {
      const res = await submitBracketScoreAction({
        tournamentId,
        matchId,
        scoringSystem,
        scoreDetail: detail,
      });
      if (res.error) setError(res.error);
      else onDone();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <SetRow
        label={t("match.field.set1")}
        a={s1a}
        b={s1b}
        onA={setS1a}
        onB={setS1b}
        disabled={pending}
      />
      <SetRow
        label={t("match.field.set2")}
        a={s2a}
        b={s2b}
        onA={setS2a}
        onB={setS2b}
        disabled={pending}
      />
      {needsThird ? (
        <SetRow
          label={thirdLabel}
          a={s3a}
          b={s3b}
          onA={setS3a}
          onB={setS3b}
          disabled={pending}
          maxLen={scoringSystem === "sets_supertiebreak" ? 3 : 2}
        />
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-2.5 py-1.5 text-xs"
        >
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? t("match.saving") : t("btn.save")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel} disabled={pending}>
          {t("btn.cancel")}
        </Button>
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="h-10 text-center text-lg font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-70"
      />
    </label>
  );
}

function SetRow({
  label,
  a,
  b,
  onA,
  onB,
  disabled,
  maxLen = 2,
}: {
  label: string;
  a: string;
  b: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
  disabled: boolean;
  maxLen?: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 items-center">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxLen}
        value={a}
        disabled={disabled}
        onChange={(e) => onA(e.target.value.replace(/\D/g, ""))}
        className="w-[48px] h-9 text-center text-base font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-70"
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxLen}
        value={b}
        disabled={disabled}
        onChange={(e) => onB(e.target.value.replace(/\D/g, ""))}
        className="w-[48px] h-9 text-center text-base font-bold rounded-[var(--radius-button)] bg-subtle border border-border text-black focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-70"
      />
    </div>
  );
}
