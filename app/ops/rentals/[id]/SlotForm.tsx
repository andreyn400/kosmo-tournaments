"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Court, RentalSlot } from "@/lib/types";
import { DAY_LABELS_LONG } from "../../coaches/format";
import type { RawSlotInput } from "./slot-input";

interface SlotFormProps {
  mode: "create" | "edit";
  slot?: RentalSlot;
  courts: Court[];
  onCancel: () => void;
  onSubmit: (raw: RawSlotInput) => Promise<{ error?: string }>;
  onDelete?: () => Promise<void>;
  pending: boolean;
}

function makeInitial(
  slot: RentalSlot | undefined,
  courts: Court[],
): RawSlotInput {
  if (slot) {
    return {
      court_ids: [...slot.court_ids],
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      notes: slot.notes ?? "",
    };
  }
  return {
    court_ids: courts[0] ? [courts[0].id] : [],
    day_of_week: 1, // Tuesday — common starting point
    start_time: "19:00",
    end_time: "21:00",
    notes: "",
  };
}

export function SlotForm({
  mode,
  slot,
  courts,
  onCancel,
  onSubmit,
  onDelete,
  pending,
}: SlotFormProps) {
  const [state, setState] = useState<RawSlotInput>(() =>
    makeInitial(slot, courts),
  );
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RawSlotInput>(key: K, value: RawSlotInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleCourt(id: string) {
    setState((s) => ({
      ...s,
      court_ids: s.court_ids.includes(id)
        ? s.court_ids.filter((c) => c !== id)
        : [...s.court_ids, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await onSubmit(state);
    if (res.error) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 p-4 rounded-md bg-subtle border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_5.5rem_5.5rem]">
        <Field label="День недели">
          <select
            value={state.day_of_week}
            onChange={(e) =>
              set("day_of_week", Number.parseInt(e.target.value, 10))
            }
            className="w-full h-9 px-3 rounded-[var(--radius-button)] bg-surface border border-border text-black text-sm"
          >
            {DAY_LABELS_LONG.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Начало">
          <Input
            type="time"
            value={state.start_time}
            onChange={(e) => set("start_time", e.target.value)}
            className="!h-9"
          />
        </Field>
        <Field label="Конец">
          <Input
            type="time"
            value={state.end_time}
            onChange={(e) => set("end_time", e.target.value)}
            className="!h-9"
          />
        </Field>
      </div>

      <Field label="Корты">
        <div className="flex flex-wrap gap-1.5">
          {courts.length === 0 ? (
            <span className="text-[11px] text-fade">
              Нет активных кортов.
            </span>
          ) : (
            courts.map((c) => {
              const on = state.court_ids.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCourt(c.id)}
                  aria-pressed={on}
                  className={[
                    "px-2.5 h-8 rounded text-xs font-semibold border transition-colors",
                    on
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-secondary border-border hover:border-border-strong",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })
          )}
        </div>
      </Field>

      <Field label="Заметка к слоту">
        <Input
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Необязательная заметка"
          className="!h-9"
        />
      </Field>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {mode === "edit" && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={pending}
            className="!text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)] mr-auto"
          >
            Удалить слот
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          Отмена
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? "Сохранение…"
            : mode === "create"
              ? "Создать"
              : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
