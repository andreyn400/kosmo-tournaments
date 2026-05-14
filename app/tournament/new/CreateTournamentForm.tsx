"use client";

import { useActionState, useEffect, useState } from "react";
import { checkConflictsAction } from "./check-conflicts-action";
import type { CourtConflict } from "@/lib/queries/courts";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import { COURT_SURFACE_KEY } from "@/lib/i18n/court-keys";
import {
  TOURNAMENT_FORMAT_KEY,
} from "@/lib/i18n/tournament-keys";
import { TOURNAMENT_TYPE_KEY } from "@/lib/i18n/calendar-keys";
import {
  SCORING_GROUP_LABEL_KEY,
  SCORING_SYSTEM_HELPER_KEY,
  SCORING_SYSTEM_LABEL_KEY,
} from "@/lib/i18n/scoring-keys";
import { PADEL_LEVELS } from "@/lib/constants";
import type {
  Court,
  ScoringSystem,
  TournamentFormat,
  TournamentType,
} from "@/lib/types";
import { generateTimeSlots } from "@/lib/time-slots";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_SYSTEMS,
  scoringGroup,
} from "@/lib/scoring-systems";
import {
  createTournamentAction,
  type CreateTournamentState,
} from "./action";

const FORMATS: TournamentFormat[] = [
  "americano",
  "team_americano",
  "mexicano",
  "team_mexicano",
  "round_robin",
  "escalera",
];

const TYPES: TournamentType[] = ["one_day", "league_season"];

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

const initial: CreateTournamentState = {};

export function CreateTournamentForm({ courts }: { courts: Court[] }) {
  const { t, tPlural } = useTranslation();
  const [state, formAction, pending] = useActionState(
    createTournamentAction,
    initial,
  );

  const [maxPlayers, setMaxPlayers] = useState("");
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>(
    DEFAULT_SCORING_SYSTEM,
  );
  const [selectedCourts, setSelectedCourts] = useState<Set<string>>(
    () => new Set(courts.map((c) => c.id)),
  );
  const [dateStart, setDateStart] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [conflicts, setConflicts] = useState<CourtConflict[]>([]);

  const parsedMax = Number.parseInt(maxPlayers, 10);
  const courtsNeeded =
    Number.isFinite(parsedMax) && parsedMax > 0
      ? Math.ceil(parsedMax / 4)
      : null;

  const handleMaxPlayersChange = (value: string) => {
    setMaxPlayers(value);
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      const needed = Math.ceil(parsed / 4);
      const firstN = courts.slice(0, needed).map((c) => c.id);
      setSelectedCourts(new Set(firstN));
    }
  };

  const parsedDur = Number(durationHours);
  const conflictInputsValid =
    !!dateStart &&
    !!startTime &&
    selectedCourts.size > 0 &&
    Number.isFinite(parsedDur) &&
    parsedDur >= 1;

  useEffect(() => {
    if (!conflictInputsValid) return;
    const ids = Array.from(selectedCourts);
    let cancelled = false;
    const tm = setTimeout(async () => {
      try {
        const res = await checkConflictsAction({
          courtIds: ids,
          date: dateStart,
          startTime,
          durationHours: parsedDur,
        });
        if (!cancelled) setConflicts(res.conflicts);
      } catch {
        if (!cancelled) setConflicts([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(tm);
    };
  }, [conflictInputsValid, selectedCourts, dateStart, startTime, parsedDur]);

  const toggleCourt = (id: string) => {
    setSelectedCourts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const courtsWord = (n: number) =>
    tPlural(n, {
      one: "division_form.courts.one",
      few: "division_form.courts.few",
      many: "division_form.courts.many",
    });

  const courtsHelper =
    courtsNeeded == null
      ? t("create.courts_hint_default")
      : t("division_form.courts_hint_needed", {
          players: parsedMax,
          n: courtsNeeded,
          word: courtsWord(courtsNeeded),
        });

  const courtsShortfall =
    courtsNeeded != null && selectedCourts.size < courtsNeeded;

  const courtPrefix = t("court.prefix");

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <Field label={t("create.field.name")} required>
          <Input
            name="name"
            required
            maxLength={120}
            placeholder={t("create.name_placeholder")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("create.field.type")}>
            <Select name="type" defaultValue="one_day">
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(TOURNAMENT_TYPE_KEY[tp])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("create.field.format")}>
            <Select name="format" defaultValue="americano">
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {t(TOURNAMENT_FORMAT_KEY[f])}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label={t("create.field.scoring")}
          hint={t(SCORING_SYSTEM_HELPER_KEY[scoringSystem])}
        >
          <Select
            name="scoring_system"
            value={scoringSystem}
            onChange={(e) => setScoringSystem(e.target.value as ScoringSystem)}
          >
            <optgroup label={t(SCORING_GROUP_LABEL_KEY.points)}>
              {SCORING_GROUPED.points.map((s) => (
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
            <optgroup label={t(SCORING_GROUP_LABEL_KEY.sets)}>
              {SCORING_GROUPED.sets.map((s) => (
                <option key={s} value={s}>
                  {t(SCORING_SYSTEM_LABEL_KEY[s])}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("create.field.date_start")} required>
            <Input
              type="date"
              name="date_start"
              required
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </Field>
          <Field
            label={t("create.field.start_time")}
            hint={t("create.start_time_hint")}
          >
            <Select
              name="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option value="">{t("create.start_time_unset")}</option>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("create.field.date_end")}
            hint={t("create.date_end_hint")}
          >
            <Input type="date" name="date_end" />
          </Field>
          <Field
            label={t("create.field.duration")}
            hint={t("create.duration_hint")}
          >
            <Input
              type="number"
              name="duration_hours"
              min={1}
              max={12}
              step={1}
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("create.field.level_min")}>
            <Select name="level_min" defaultValue="">
              <option value="">{t("level.any")}</option>
              {PADEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("create.field.level_max")}>
            <Select name="level_max" defaultValue="">
              <option value="">{t("level.any")}</option>
              {PADEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("create.field.max_players")}
            hint={t("create.max_players_hint")}
          >
            <Input
              type="number"
              name="max_players"
              min={4}
              step={4}
              placeholder="16"
              value={maxPlayers}
              onChange={(e) => handleMaxPlayersChange(e.target.value)}
            />
          </Field>
          <Field label={t("create.field.entry_fee")}>
            <Input type="number" name="entry_fee" min={0} placeholder="0" />
          </Field>
        </div>

        <Field label={t("create.field.prize")}>
          <Input
            name="prize_description"
            maxLength={200}
            placeholder={t("create.prize_placeholder")}
          />
        </Field>

        <Field label={t("create.field.courts")} required hint={courtsHelper}>
          <div className="flex flex-col gap-1.5 border border-border rounded-[var(--radius-button)] bg-subtle p-2.5">
            {courts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-button)] hover:bg-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="court_ids"
                  value={c.id}
                  checked={selectedCourts.has(c.id)}
                  onChange={() => toggleCourt(c.id)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-black flex-1">
                  {c.name}
                  <span className="text-muted text-xs ml-2 tabular-nums">
                    №{c.number}
                  </span>
                </span>
                <span className="text-xs text-muted">
                  {t(COURT_SURFACE_KEY[c.surface])}
                </span>
              </label>
            ))}
          </div>
          {courtsShortfall ? (
            <span className="text-xs text-[var(--color-danger)]">
              {t("division_form.courts_shortfall", {
                players: parsedMax,
                n: courtsNeeded!,
                word: courtsWord(courtsNeeded!),
              })}
            </span>
          ) : null}
          {conflictInputsValid && conflicts.length > 0 ? (
            <div className="flex flex-col gap-1 text-xs text-[var(--color-warning)]">
              {conflicts.map((c) => (
                <span key={c.tournamentId}>
                  {t("create.conflict", {
                    courts: c.courtNumbers
                      .map((n) => `${courtPrefix}${n}`)
                      .join(", "),
                    name: c.tournamentName,
                  })}
                </span>
              ))}
            </div>
          ) : null}
        </Field>

        <Field label={t("create.field.notes")}>
          <Textarea
            name="notes"
            maxLength={500}
            placeholder={t("create.notes_placeholder")}
          />
        </Field>
      </Card>

      {state.error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("btn.saving") : t("create.submit")}
        </Button>
        <Link href="/">
          <Button type="button" variant="secondary" disabled={pending}>
            {t("btn.cancel")}
          </Button>
        </Link>
      </div>
    </form>
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
