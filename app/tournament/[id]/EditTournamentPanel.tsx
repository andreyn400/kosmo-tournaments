"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PADEL_LEVELS, COURT_SURFACE_LABEL_RU } from "@/lib/constants";
import { generateTimeSlots } from "@/lib/time-slots";
import type { Court, Tournament } from "@/lib/types";
import { editTournamentAction } from "./edit-tournament-action";

const TIME_SLOTS = generateTimeSlots();

export function EditTournamentPanel({
  tournament,
  allCourts,
}: {
  tournament: Tournament;
  allCourts: Court[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tournament.name);
  const [startTime, setStartTime] = useState(tournament.start_time ?? "");
  const [durationHours, setDurationHours] = useState<string>(
    String(tournament.duration_hours),
  );
  const [levelMin, setLevelMin] = useState<string>(tournament.level_min ?? "");
  const [levelMax, setLevelMax] = useState<string>(tournament.level_max ?? "");
  const [maxPlayers, setMaxPlayers] = useState<string>(
    tournament.max_players != null ? String(tournament.max_players) : "",
  );
  const [entryFee, setEntryFee] = useState<string>(String(tournament.entry_fee));
  const [prizeDescription, setPrizeDescription] = useState<string>(
    tournament.prize_description ?? "",
  );
  const [notes, setNotes] = useState<string>(tournament.notes ?? "");
  const [courtSet, setCourtSet] = useState<Set<string>>(
    () => new Set(tournament.court_ids),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleCourt = (id: string) => {
    setCourtSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setName(tournament.name);
    setStartTime(tournament.start_time ?? "");
    setDurationHours(String(tournament.duration_hours));
    setLevelMin(tournament.level_min ?? "");
    setLevelMax(tournament.level_max ?? "");
    setMaxPlayers(
      tournament.max_players != null ? String(tournament.max_players) : "",
    );
    setEntryFee(String(tournament.entry_fee));
    setPrizeDescription(tournament.prize_description ?? "");
    setNotes(tournament.notes ?? "");
    setCourtSet(new Set(tournament.court_ids));
    setError(null);
  };

  const cancel = () => {
    reset();
    setOpen(false);
  };

  const submit = () => {
    setError(null);
    const duration = Number(durationHours);
    const fee = Number(entryFee);
    const maxP = maxPlayers.trim() ? Number(maxPlayers) : null;
    startTransition(async () => {
      const res = await editTournamentAction({
        tournamentId: tournament.id,
        name,
        courtIds: Array.from(courtSet),
        startTime: startTime || null,
        durationHours: duration,
        levelMin: levelMin || null,
        levelMax: levelMax || null,
        maxPlayers: maxP,
        entryFee: fee,
        prizeDescription: prizeDescription || null,
        notes: notes || null,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Редактировать
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full pt-4 border-t border-border">
      <h3 className="font-semibold text-black">Редактирование</h3>

      <Field label="Название" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Время начала">
          <Select
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
        <Field label="Длительность, часов" required>
          <Input
            type="number"
            min={1}
            max={12}
            step={1}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Уровень от">
          <Select
            value={levelMin}
            onChange={(e) => setLevelMin(e.target.value)}
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
            value={levelMax}
            onChange={(e) => setLevelMax(e.target.value)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Макс. игроков">
          <Input
            type="number"
            min={4}
            step={4}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            placeholder="Не указано"
          />
        </Field>
        <Field label="Взнос, ₽">
          <Input
            type="number"
            min={0}
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Приз">
        <Input
          value={prizeDescription}
          onChange={(e) => setPrizeDescription(e.target.value)}
          maxLength={200}
          placeholder="Например: призовой фонд по итогам финала"
        />
      </Field>

      <Field label="Корты" required>
        <div className="flex flex-col gap-1.5 border border-border rounded-[var(--radius-button)] bg-subtle p-2.5">
          {allCourts.length === 0 ? (
            <p className="text-xs text-muted px-2 py-1">
              Нет активных кортов.
            </p>
          ) : (
            allCourts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-button)] hover:bg-surface cursor-pointer"
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
                <span className="text-xs text-muted">
                  {COURT_SURFACE_LABEL_RU[c.surface]}
                </span>
              </label>
            ))
          )}
        </div>
      </Field>

      <Field label="Заметки">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder="Любая служебная информация"
        />
      </Field>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3 py-2 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={pending}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-black">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
