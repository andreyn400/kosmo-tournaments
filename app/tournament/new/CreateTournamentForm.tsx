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
import {
  PADEL_LEVELS,
  FORMAT_LABEL_RU,
  TYPE_LABEL_RU,
  COURT_SURFACE_LABEL_RU,
} from "@/lib/constants";
import type {
  Court,
  ScoringSystem,
  TournamentFormat,
  TournamentType,
} from "@/lib/types";
import { generateTimeSlots } from "@/lib/time-slots";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_GROUP_LABEL_RU,
  SCORING_SYSTEM_HELPER_RU,
  SCORING_SYSTEM_LABEL_RU,
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
  sets: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "sets"),
};

const initial: CreateTournamentState = {};

export function CreateTournamentForm({ courts }: { courts: Court[] }) {
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
    const t = setTimeout(async () => {
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
      clearTimeout(t);
    };
  }, [
    conflictInputsValid,
    selectedCourts,
    dateStart,
    startTime,
    parsedDur,
  ]);

  const toggleCourt = (id: string) => {
    setSelectedCourts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const courtsHelper =
    courtsNeeded == null
      ? "Выберите хотя бы один корт. По умолчанию выбраны все активные."
      : `Для ${parsedMax} игроков нужно ${courtsNeeded} ${courtsNeeded === 1 ? "корт" : courtsNeeded < 5 ? "корта" : "кортов"}.`;

  const courtsShortfall =
    courtsNeeded != null && selectedCourts.size < courtsNeeded;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <Field label="Название" required>
          <Input
            name="name"
            required
            maxLength={120}
            placeholder="Например: Кубок Kosmo · Май"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Тип">
            <Select name="type" defaultValue="one_day">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL_RU[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Формат">
            <Select name="format" defaultValue="americano">
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
          hint={SCORING_SYSTEM_HELPER_RU[scoringSystem]}
        >
          <Select
            name="scoring_system"
            value={scoringSystem}
            onChange={(e) => setScoringSystem(e.target.value as ScoringSystem)}
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
          <Field label="Дата начала" required>
            <Input
              type="date"
              name="date_start"
              required
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </Field>
          <Field label="Время начала" hint="Можно оставить пустым">
            <Select
              name="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option value="">Не указано</option>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Дата окончания" hint="Оставьте пустым для однодневного">
            <Input type="date" name="date_end" />
          </Field>
          <Field
            label="Длительность, часов"
            hint="Используется для отображения в календаре"
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
          <Field label="Уровень от">
            <Select name="level_min" defaultValue="">
              <option value="">Любой</option>
              {PADEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Уровень до">
            <Select name="level_max" defaultValue="">
              <option value="">Любой</option>
              {PADEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Макс. игроков" hint="Должно быть кратно 4">
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
          <Field label="Взнос, ₽">
            <Input type="number" name="entry_fee" min={0} placeholder="0" />
          </Field>
        </div>

        <Field label="Приз">
          <Input
            name="prize_description"
            maxLength={200}
            placeholder="Например: сертификат в pro-shop"
          />
        </Field>

        <Field label="Корты" required hint={courtsHelper}>
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
                  {COURT_SURFACE_LABEL_RU[c.surface]}
                </span>
              </label>
            ))}
          </div>
          {courtsShortfall ? (
            <span className="text-xs text-[var(--color-danger)]">
              Для {parsedMax} игроков необходимо минимум {courtsNeeded}{" "}
              {courtsNeeded === 1 ? "корт" : courtsNeeded! < 5 ? "корта" : "кортов"}.
            </span>
          ) : null}
          {conflictInputsValid && conflicts.length > 0 ? (
            <div className="flex flex-col gap-1 text-xs text-[var(--color-warning)]">
              {conflicts.map((c) => (
                <span key={c.tournamentId}>
                  ⚠ {c.courtNumbers.map((n) => `К${n}`).join(", ")} занят «
                  {c.tournamentName}» в это время
                </span>
              ))}
            </div>
          ) : null}
        </Field>

        <Field label="Заметки">
          <Textarea
            name="notes"
            maxLength={500}
            placeholder="Любая служебная информация"
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
          {pending ? "Сохранение…" : "Создать турнир"}
        </Button>
        <Link href="/">
          <Button type="button" variant="secondary" disabled={pending}>
            Отмена
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
