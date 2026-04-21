"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import {
  checkDivisionCourtConflictsAction,
  type DivisionCourtConflict,
} from "./check-division-court-conflicts-action";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  DIVISION_CATEGORY_LABEL_RU,
  FORMAT_LABEL_RU,
  PADEL_LEVELS,
} from "@/lib/constants";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_GROUP_LABEL_RU,
  SCORING_SYSTEM_HELPER_RU,
  SCORING_SYSTEM_LABEL_RU,
  SCORING_SYSTEMS,
  scoringGroup,
} from "@/lib/scoring-systems";
import type {
  Court,
  Division,
  DivisionCategory,
  ScoringSystem,
  TournamentFormat,
} from "@/lib/types";

const CATEGORIES: DivisionCategory[] = ["mens", "womens", "mixed", "open"];

const FORMATS: TournamentFormat[] = [
  "americano",
  "team_americano",
  "mexicano",
  "team_mexicano",
  "round_robin",
  "escalera",
];

const SCORING_GROUPED: Record<
  ReturnType<typeof scoringGroup>,
  ScoringSystem[]
> = {
  points: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "points"),
  games: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "games"),
  sets: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "sets"),
};

export type DivisionFormValues = {
  name: string;
  category: DivisionCategory;
  format: TournamentFormat;
  scoring_system: ScoringSystem;
  level_min: string;
  level_max: string;
  max_players: string;
  court_ids: Set<string>;
};

export function initialFromDivision(d: Division): DivisionFormValues {
  return {
    name: d.name,
    category: d.category,
    format: d.format,
    scoring_system: d.scoring_system,
    level_min: d.level_min ?? "",
    level_max: d.level_max ?? "",
    max_players: d.max_players != null ? String(d.max_players) : "",
    court_ids: new Set(d.court_ids ?? []),
  };
}

export function defaultInitial(defaults: {
  format: TournamentFormat;
  scoring_system: ScoringSystem;
  level_min: string | null;
  level_max: string | null;
  court_ids: string[];
}): DivisionFormValues {
  return {
    name: "",
    category: "open",
    format: defaults.format,
    scoring_system: defaults.scoring_system ?? DEFAULT_SCORING_SYSTEM,
    level_min: defaults.level_min ?? "",
    level_max: defaults.level_max ?? "",
    max_players: "",
    court_ids: new Set(defaults.court_ids),
  };
}

export function DivisionForm({
  initial,
  tournamentId,
  divisionId,
  tournamentCourts,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: DivisionFormValues;
  tournamentId: string;
  divisionId?: string;
  tournamentCourts: Court[];
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: DivisionFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<DivisionFormValues>(initial);
  const [siblingConflicts, setSiblingConflicts] = useState<
    DivisionCourtConflict[]
  >([]);

  const courtIdsKey = Array.from(values.court_ids).sort().join(",");
  const hasCourts = values.court_ids.size > 0;

  useEffect(() => {
    if (!hasCourts) return;
    const ids = courtIdsKey.split(",");
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await checkDivisionCourtConflictsAction({
          tournamentId,
          divisionId,
          courtIds: ids,
        });
        if (!cancelled) setSiblingConflicts(res.conflicts);
      } catch {
        if (!cancelled) setSiblingConflicts([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hasCourts, courtIdsKey, tournamentId, divisionId]);

  const visibleConflicts = hasCourts ? siblingConflicts : [];

  const set = <K extends keyof DivisionFormValues>(
    key: K,
    v: DivisionFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: v }));

  const toggleCourt = (id: string) => {
    setValues((prev) => {
      const next = new Set(prev.court_ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, court_ids: next };
    });
  };

  const parsedMax = Number.parseInt(values.max_players, 10);
  const courtsNeeded =
    Number.isFinite(parsedMax) && parsedMax > 0
      ? Math.ceil(parsedMax / 4)
      : null;
  const courtsShortfall =
    courtsNeeded != null && values.court_ids.size < courtsNeeded;

  const canSubmit =
    !pending &&
    values.name.trim().length > 0 &&
    values.court_ids.size > 0 &&
    !courtsShortfall;

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-subtle/40 p-5">
      <Field label="Название" required>
        <Input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={120}
          placeholder="Например: Мужчины Д1 Американо"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Категория">
          <Select
            value={values.category}
            onChange={(e) =>
              set("category", e.target.value as DivisionCategory)
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DIVISION_CATEGORY_LABEL_RU[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Формат">
          <Select
            value={values.format}
            onChange={(e) => set("format", e.target.value as TournamentFormat)}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL_RU[f]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Система счёта"
        hint={SCORING_SYSTEM_HELPER_RU[values.scoring_system]}
      >
        <Select
          value={values.scoring_system}
          onChange={(e) =>
            set("scoring_system", e.target.value as ScoringSystem)
          }
        >
          <optgroup label={SCORING_GROUP_LABEL_RU.points}>
            {SCORING_GROUPED.points.map((s) => (
              <option key={s} value={s}>
                {SCORING_SYSTEM_LABEL_RU[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label={SCORING_GROUP_LABEL_RU.games}>
            {SCORING_GROUPED.games.map((s) => (
              <option key={s} value={s}>
                {SCORING_SYSTEM_LABEL_RU[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label={SCORING_GROUP_LABEL_RU.sets}>
            {SCORING_GROUPED.sets.map((s) => (
              <option key={s} value={s}>
                {SCORING_SYSTEM_LABEL_RU[s]}
              </option>
            ))}
          </optgroup>
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Уровень от">
          <Select
            value={values.level_min}
            onChange={(e) => set("level_min", e.target.value)}
          >
            <option value="">Любой</option>
            {PADEL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Уровень до">
          <Select
            value={values.level_max}
            onChange={(e) => set("level_max", e.target.value)}
          >
            <option value="">Любой</option>
            {PADEL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Макс. игроков" hint="Кратно 4. Оставьте пустым — без лимита.">
        <Input
          type="number"
          min={4}
          step={4}
          placeholder="8"
          value={values.max_players}
          onChange={(e) => set("max_players", e.target.value)}
        />
      </Field>

      <Field
        label="Корты"
        required
        hint={
          courtsNeeded == null
            ? "Выберите корты этого дивизиона из кортов турнира."
            : `Для ${parsedMax} игроков нужно ${courtsNeeded} ${courtsNeeded === 1 ? "корт" : courtsNeeded < 5 ? "корта" : "кортов"}.`
        }
      >
        <div className="flex flex-col gap-1.5 border border-border rounded-[var(--radius-button)] bg-surface p-2.5">
          {tournamentCourts.length === 0 ? (
            <p className="text-xs text-muted px-2 py-1">
              У турнира не выбрано ни одного корта.
            </p>
          ) : (
            tournamentCourts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-button)] hover:bg-subtle cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.court_ids.has(c.id)}
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
        {courtsShortfall ? (
          <span className="text-xs text-[var(--color-danger)]">
            Для {parsedMax} игроков необходимо минимум {courtsNeeded}{" "}
            {courtsNeeded === 1 ? "корт" : courtsNeeded! < 5 ? "корта" : "кортов"}.
          </span>
        ) : null}
        {visibleConflicts.length > 0 ? (
          <div className="flex flex-col gap-1 text-xs text-[var(--color-warning)]">
            {visibleConflicts.map((c, idx) => (
              <span key={idx}>
                ⚠ Корт{" "}
                {c.courtNumber !== null ? `К${c.courtNumber}` : "?"} уже
                используется дивизионом «{c.divisionName}» (идёт).
              </span>
            ))}
          </div>
        ) : null}
      </Field>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Отмена
        </Button>
        <Button disabled={!canSubmit} onClick={() => onSubmit(values)}>
          {pending ? "Сохранение…" : submitLabel}
        </Button>
      </div>
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
