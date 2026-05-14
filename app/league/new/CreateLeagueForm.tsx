"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import { PADEL_LEVELS } from "@/lib/constants";
import { generateTimeSlots } from "@/lib/time-slots";
import type { Court, ScoringSystem, TournamentFormat } from "@/lib/types";
import {
  DEFAULT_POINTS_TABLE,
  type PointsTable,
} from "@/lib/league-points";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_SYSTEMS,
  scoringGroup,
} from "@/lib/scoring-systems";
import { TOURNAMENT_FORMAT_KEY } from "@/lib/i18n/tournament-keys";
import {
  SCORING_GROUP_LABEL_KEY,
  SCORING_SYSTEM_HELPER_KEY,
  SCORING_SYSTEM_LABEL_KEY,
} from "@/lib/i18n/scoring-keys";
import { COURT_SURFACE_KEY } from "@/lib/i18n/court-keys";
import {
  createLeagueAction,
  type CreateLeagueState,
} from "./action";

const INDIVIDUAL_FORMATS: TournamentFormat[] = [
  "americano",
  "mexicano",
  "round_robin",
];

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

const initial: CreateLeagueState = {};

export function CreateLeagueForm({ courts }: { courts: Court[] }) {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(
    createLeagueAction,
    initial,
  );
  const [dates, setDates] = useState<string[]>([]);
  const [nextDate, setNextDate] = useState<string>("");
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>(
    DEFAULT_SCORING_SYSTEM,
  );

  const addDate = () => {
    if (!nextDate) return;
    if (dates.includes(nextDate)) return;
    setDates((d) => [...d, nextDate].sort());
    setNextDate("");
  };
  const removeDate = (d: string) => {
    setDates((ds) => ds.filter((x) => x !== d));
  };

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <Field label={t("league.create.field.name")} required>
          <Input
            name="name"
            required
            maxLength={120}
            placeholder={t("league.create.name_placeholder")}
          />
        </Field>

        <Field
          label={t("league.create.field.session_format")}
          hint={t("league.create.session_format_hint")}
        >
          <Select name="format" defaultValue="americano">
            {INDIVIDUAL_FORMATS.map((f) => (
              <option key={f} value={f}>
                {t(TOURNAMENT_FORMAT_KEY[f])}
              </option>
            ))}
          </Select>
        </Field>

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

        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-sm font-medium text-black">
                {t("league.create.field.session_dates")}{" "}
                <span className="text-accent">*</span>
              </span>
              <Input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={addDate}
              disabled={!nextDate || dates.includes(nextDate)}
            >
              {t("league.create.add_date")}
            </Button>
          </div>
          <input
            type="hidden"
            name="session_dates"
            value={dates.join(",")}
          />
          {dates.length === 0 ? (
            <p className="text-xs text-muted">
              {t("league.create.no_dates_hint")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {dates.map((d, idx) => (
                <li
                  key={d}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white text-sm"
                >
                  <span className="text-black tabular-nums">
                    {t("league.create.session_row", { n: idx + 1, date: d })}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => removeDate(d)}
                  >
                    {t("league.create.remove_date")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("create.field.level_min")}>
            <Select name="level_min" defaultValue="">
              <option value="">{t("league.create.level_any")}</option>
              {PADEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("create.field.level_max")}>
            <Select name="level_max" defaultValue="">
              <option value="">{t("league.create.level_any")}</option>
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
            label={t("league.create.field.max_session_players")}
            hint={t("create.max_players_hint")}
          >
            <Input
              type="number"
              name="max_players"
              min={4}
              step={4}
              placeholder="16"
            />
          </Field>
          <Field
            label={t("league.create.field.qualification_spots")}
            hint={t("league.create.qualification_spots_hint")}
          >
            <Select name="qualification_spots" defaultValue="8">
              {[2, 4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("league.create.field.default_start_time")}
            hint={t("league.create.default_start_time_hint")}
          >
            <Select name="default_start_time" defaultValue="">
              <option value="">{t("create.start_time_unset")}</option>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("league.create.field.finals_date")}
            hint={t("league.create.finals_date_hint")}
          >
            <Input type="date" name="finals_date" />
          </Field>
        </div>

        <Field
          label={t("league.create.field.duration")}
          hint={t("league.create.duration_hint")}
        >
          <Input
            type="number"
            name="duration_hours"
            min={1}
            max={12}
            step={1}
            defaultValue={2}
          />
        </Field>

        <Field label={t("create.field.entry_fee")}>
          <Input type="number" name="entry_fee" min={0} placeholder="0" />
        </Field>

        <Field label={t("create.field.prize")}>
          <Input
            name="prize_description"
            maxLength={200}
            placeholder={t("league.create.prize_placeholder")}
          />
        </Field>

        <Field
          label={t("create.field.courts")}
          required
          hint={t("create.courts_hint_default")}
        >
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
                  defaultChecked
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
        </Field>

        <Field label={t("create.field.notes")}>
          <Textarea
            name="notes"
            maxLength={500}
            placeholder={t("create.notes_placeholder")}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-semibold text-black">
          {t("league.create.points_table_title")}
        </h3>
        <p className="text-xs text-muted">
          {t("league.create.points_table_copy")}
        </p>
        <PointsTablePreview table={DEFAULT_POINTS_TABLE} />
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
        <Button type="submit" disabled={pending || dates.length === 0}>
          {pending ? t("btn.saving") : t("league.create.submit")}
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

function PointsTablePreview({ table }: { table: PointsTable }) {
  const { t } = useTranslation();
  const sizes = Object.keys(table).sort((a, b) => Number(b) - Number(a));
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {sizes.map((size) => {
        const positions = table[size];
        const sorted = Object.entries(positions).sort(
          (a, b) => Number(a[0]) - Number(b[0]),
        );
        return (
          <div
            key={size}
            className="border border-border rounded-[var(--radius-button)] p-3 bg-subtle"
          >
            <div className="text-xs text-muted uppercase tracking-wider mb-1.5">
              {t("league.create.points_size_label", { n: size })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums">
              {sorted.map(([pos, pts]) => (
                <span key={pos} className="text-black">
                  <span className="text-muted">{pos}.</span> {pts}
                </span>
              ))}
            </div>
          </div>
        );
      })}
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
