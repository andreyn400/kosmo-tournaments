"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import { generateTimeSlots, normalizeTime } from "@/lib/time-slots";
import { SCORING_SYSTEMS, scoringGroup } from "@/lib/scoring-systems";
import {
  SCORING_GROUP_LABEL_KEY,
  SCORING_SYSTEM_HELPER_KEY,
  SCORING_SYSTEM_LABEL_KEY,
} from "@/lib/i18n/scoring-keys";
import {
  snakePairsForBracket,
  swapPairMembers,
  type FormedPair,
} from "@/lib/finals-pair-formation";
import { isBracketSize, type BracketSize } from "@/lib/finals-seeding";
import type { Qualification } from "@/lib/finals-qualification";
import type { Court, ScoringSystem } from "@/lib/types";
import { createFinalsAction } from "./action";

const TIME_SLOTS = generateTimeSlots();

const SCORING_GROUPED: Record<
  ReturnType<typeof scoringGroup>,
  ScoringSystem[]
> = {
  points: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "points"),
  games: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "games"),
  combined: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "combined"),
  sets: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "sets"),
};

export function SetupWizard({
  tournamentId,
  leagueFinalsDate,
  tournamentStartTime,
  qualification,
  playerNameById,
  courts,
  tournamentCourtIds,
  allowedBracketSizes,
  defaultBracketSize,
}: {
  tournamentId: string;
  leagueFinalsDate: string | null;
  tournamentStartTime: string | null;
  qualification: Qualification;
  playerNameById: Record<string, string>;
  courts: Court[];
  tournamentCourtIds: string[];
  allowedBracketSizes: number[];
  defaultBracketSize: number;
}) {
  const { t } = useTranslation();
  const [bracketSize, setBracketSize] = useState<number>(defaultBracketSize);
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>(
    "sets_best3",
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    leagueFinalsDate ?? "",
  );
  const [startTime, setStartTime] = useState<string>(
    normalizeTime(tournamentStartTime) ?? "",
  );
  const [courtSet, setCourtSet] = useState<Set<string>>(
    () => new Set(tournamentCourtIds),
  );
  const [pairsOverride, setPairsOverride] = useState<FormedPair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isIndividual = qualification.kind === "individual";

  const autoPairs = useMemo<FormedPair[]>(() => {
    if (!isIndividual || !isBracketSize(bracketSize)) return [];
    try {
      return snakePairsForBracket(
        qualification.individuals,
        bracketSize as BracketSize,
      );
    } catch {
      return [];
    }
  }, [isIndividual, bracketSize, qualification]);

  const autoKey = autoPairs
    .map((p) => `${p.player1_id}:${p.player2_id}`)
    .join("|");
  const [prevAutoKey, setPrevAutoKey] = useState(autoKey);
  if (prevAutoKey !== autoKey) {
    setPrevAutoKey(autoKey);
    setPairsOverride(null);
  }

  const pairs = pairsOverride ?? autoPairs;

  const toggleCourt = (id: string) => {
    setCourtSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activePairs = useMemo<FormedPair[]>(() => {
    if (isIndividual) return pairs;
    if (!isBracketSize(bracketSize)) return [];
    return qualification.pairs.slice(0, bracketSize).map((p, idx) => ({
      pairSeed: idx + 1,
      player1_id: p.player1_id,
      player2_id: p.player2_id,
      player1_name: playerNameById[p.player1_id] ?? "—",
      player2_name: playerNameById[p.player2_id] ?? "—",
    }));
  }, [isIndividual, pairs, qualification, bracketSize, playerNameById]);

  const swapTop = (idx: number, otherIdx: number) => {
    setPairsOverride((prev) =>
      swapPairMembers(prev ?? autoPairs, idx, otherIdx, "top"),
    );
  };
  const swapBottom = (idx: number, otherIdx: number) => {
    setPairsOverride((prev) =>
      swapPairMembers(prev ?? autoPairs, idx, otherIdx, "bottom"),
    );
  };

  const resetPairs = () => {
    setPairsOverride(null);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createFinalsAction({
        tournamentId,
        bracketSize,
        scoringSystem,
        scheduledDate: scheduledDate || null,
        startTime: startTime || null,
        courtIds: Array.from(courtSet),
        individualPairs: isIndividual
          ? pairs.map((p) => ({
              player1_id: p.player1_id,
              player2_id: p.player2_id,
            }))
          : undefined,
      });
      if (res?.error) setError(res.error);
    });
  };

  const enoughPairs = isIndividual
    ? activePairs.length === bracketSize
    : activePairs.length >= bracketSize / 2;
  const canSubmit =
    !pending && enoughPairs && courtSet.size > 0 && isBracketSize(bracketSize);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-black">
            {t("finals.setup.params_title")}
          </h2>
          <p className="text-sm text-muted">
            {isIndividual
              ? t("finals.setup.qualified_individuals", {
                  n: qualification.individuals.length,
                })
              : t("finals.setup.qualified_pairs", {
                  n: qualification.pairs.length,
                })}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("finals.setup.field.bracket_size")} required>
            <Select
              value={String(bracketSize)}
              onChange={(e) => setBracketSize(Number(e.target.value))}
            >
              {allowedBracketSizes.map((s) => (
                <option key={s} value={s}>
                  {t("finals.setup.bracket_option", {
                    n: s,
                    rounds: Math.log2(s),
                  })}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("finals.setup.field.scoring")}
            hint={t(SCORING_SYSTEM_HELPER_KEY[scoringSystem])}
          >
            <Select
              value={scoringSystem}
              onChange={(e) =>
                setScoringSystem(e.target.value as ScoringSystem)
              }
            >
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.sets)}>
                {SCORING_GROUPED.sets.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.games)}>
                {SCORING_GROUPED.games.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.combined)}>
                {SCORING_GROUPED.combined.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.points)}>
                {SCORING_GROUPED.points.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>

          <Field label={t("finals.setup.field.finals_date")}>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </Field>

          <Field label={t("finals.setup.field.start_time")}>
            <Select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option value="">{t("finals.setup.start_time_unset")}</option>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t("finals.setup.field.courts")} required>
          <div className="flex flex-col gap-1.5 border border-border rounded-[var(--radius-button)] bg-surface p-2.5">
            {courts.length === 0 ? (
              <p className="text-xs text-muted px-2 py-1">
                {t("finals.setup.no_tournament_courts")}
              </p>
            ) : (
              courts.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-button)] hover:bg-subtle cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={courtSet.has(c.id)}
                    onChange={() => toggleCourt(c.id)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span className="text-sm text-black flex-1">
                    {c.name}
                    <span className="text-muted text-xs ml-2 tabular-nums">
                      №{c.number}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </Field>
      </Card>

      {isIndividual ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-black">
                {t("finals.setup.pairs_title")}
              </h2>
              <p className="text-xs text-muted">
                {t("finals.setup.pairs_hint", {
                  a: bracketSize * 2,
                  b: bracketSize * 2 - 1,
                })}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={resetPairs}>
              {t("finals.setup.reset_pairs")}
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {pairs.map((p, idx) => (
              <li
                key={`pair-${idx}`}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-white p-3"
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent-soft text-accent text-xs font-semibold tabular-nums">
                  {p.pairSeed}
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black">
                      {p.player1_name}
                    </span>
                    <SwapButton
                      label={t("finals.setup.swap_top")}
                      onSelect={(target) => swapTop(idx, target)}
                      pairs={pairs}
                      excludeIndex={idx}
                      side="top"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">
                      {p.player2_name}
                    </span>
                    <SwapButton
                      label={t("finals.setup.swap_bottom")}
                      onSelect={(target) => swapBottom(idx, target)}
                      pairs={pairs}
                      excludeIndex={idx}
                      side="bottom"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            {t("finals.setup.seed_title")}
          </h2>
          <ul className="flex flex-col gap-2">
            {activePairs.map((p) => (
              <li
                key={`team-pair-${p.pairSeed}`}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-white p-3"
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent-soft text-accent text-xs font-semibold tabular-nums">
                  {p.pairSeed}
                </span>
                <span className="text-sm text-black">
                  {p.player1_name} / {p.player2_name}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button size="lg" disabled={!canSubmit} onClick={submit}>
          {pending
            ? t("finals.setup.creating")
            : t("finals.setup.create_cta_long")}
        </Button>
      </div>
    </div>
  );
}

function SwapButton({
  label,
  pairs,
  excludeIndex,
  side,
  onSelect,
}: {
  label: string;
  pairs: FormedPair[];
  excludeIndex: number;
  side: "top" | "bottom";
  onSelect: (targetIndex: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-muted hover:text-black underline-offset-2 hover:underline"
      >
        {label}
      </button>
      {open ? (
        <div className="absolute z-10 left-0 top-full mt-1 w-56 rounded-[var(--radius-button)] border border-border bg-surface shadow-md p-1">
          <p className="text-[11px] text-muted px-2 py-1">
            {t("finals.setup.swap_with_pair")}
          </p>
          {pairs.map((p, i) => {
            if (i === excludeIndex) return null;
            const name = side === "top" ? p.player1_name : p.player2_name;
            return (
              <button
                key={`swap-${i}-${side}`}
                type="button"
                onClick={() => {
                  onSelect(i);
                  setOpen(false);
                }}
                className="block w-full text-left text-sm px-2 py-1.5 rounded-[var(--radius-button)] hover:bg-subtle"
              >
                #{p.pairSeed} — {name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-black">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
