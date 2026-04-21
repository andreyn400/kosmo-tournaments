"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  PADEL_LEVELS,
  FORMAT_LABEL_RU,
  COURT_SURFACE_LABEL_RU,
} from "@/lib/constants";
import { generateTimeSlots } from "@/lib/time-slots";
import type { Court, ScoringSystem, TournamentFormat } from "@/lib/types";
import {
  DEFAULT_POINTS_TABLE,
  type PointsTable,
} from "@/lib/league-points";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_GROUP_LABEL_RU,
  SCORING_SYSTEM_HELPER_RU,
  SCORING_SYSTEM_LABEL_RU,
  SCORING_SYSTEMS,
  scoringGroup,
} from "@/lib/scoring-systems";
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
  sets: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "sets"),
};

const initial: CreateLeagueState = {};

export function CreateLeagueForm({ courts }: { courts: Court[] }) {
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
        <Field label="Название лиги" required>
          <Input
            name="name"
            required
            maxLength={120}
            placeholder="Например: Kosmo Весна 2026"
          />
        </Field>

        <Field label="Формат сессий" hint="Для лиги доступны индивидуальные форматы">
          <Select name="format" defaultValue="americano">
            {INDIVIDUAL_FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL_RU[f]}
              </option>
            ))}
          </Select>
        </Field>

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

        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-sm font-medium text-black">
                Даты сессий <span className="text-accent">*</span>
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
              + Добавить
            </Button>
          </div>
          <input
            type="hidden"
            name="session_dates"
            value={dates.join(",")}
          />
          {dates.length === 0 ? (
            <p className="text-xs text-muted">
              Добавьте одну или несколько дат проведения.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {dates.map((d, idx) => (
                <li
                  key={d}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white text-sm"
                >
                  <span className="text-black tabular-nums">
                    Сессия {idx + 1} · {d}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => removeDate(d)}
                  >
                    Удалить
                  </Button>
                </li>
              ))}
            </ul>
          )}
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
          <Field label="Макс. игроков в сессии" hint="Должно быть кратно 4">
            <Input
              type="number"
              name="max_players"
              min={4}
              step={4}
              placeholder="16"
            />
          </Field>
          <Field
            label="Квалификационных мест"
            hint="Должно быть степенью двойки для корректной финальной сетки"
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
            label="Время начала сессий"
            hint="По умолчанию для каждой сессии; можно изменить перед стартом"
          >
            <Select name="default_start_time" defaultValue="">
              <option value="">Не указано</option>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Дата финала" hint="Можно задать позже">
            <Input type="date" name="finals_date" />
          </Field>
        </div>

        <Field
          label="Длительность сессии, часов"
          hint="Используется для отображения сессий в календаре"
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

        <Field label="Взнос, ₽">
          <Input type="number" name="entry_fee" min={0} placeholder="0" />
        </Field>

        <Field label="Приз">
          <Input
            name="prize_description"
            maxLength={200}
            placeholder="Например: призовой фонд по итогам финала"
          />
        </Field>

        <Field
          label="Корты"
          required
          hint="Выберите хотя бы один корт. По умолчанию выбраны все активные."
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
                  {COURT_SURFACE_LABEL_RU[c.surface]}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Заметки">
          <Textarea
            name="notes"
            maxLength={500}
            placeholder="Любая служебная информация"
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-semibold text-black">Таблица очков</h3>
        <p className="text-xs text-muted">
          Очки начисляются по месту в финальной таблице сессии. Значения по
          умолчанию; редактирование появится позже.
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
          {pending ? "Сохранение…" : "Создать лигу"}
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

function PointsTablePreview({ table }: { table: PointsTable }) {
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
              {size} игроков
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
