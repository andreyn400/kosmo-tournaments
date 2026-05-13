"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ALL_PROGRAM_TYPES } from "@/lib/program-groups";
import type { Program } from "@/lib/types";
import type { RawProgramInput } from "./program-input";

type Mode = "create" | "edit";

interface ProgramFormProps {
  mode: Mode;
  program?: Program;
  defaultType?: string;
  onCancel: () => void;
  onSubmit: (
    input: RawProgramInput,
  ) => Promise<{ error?: string } | { ok: true }>;
  pending: boolean;
  onDelete?: () => void;
}

function makeInitial(
  program: Program | undefined,
  defaultType: string | undefined,
): {
  name: string;
  type: string;
  duration: string;
  pricePeak: string;
  priceOff: string;
  courts: string;
  maxPlayers: string;
  description: string;
  isActive: boolean;
} {
  return {
    name: program?.name ?? "",
    type: program?.type ?? defaultType ?? ALL_PROGRAM_TYPES[0],
    duration: String(program?.duration_minutes ?? 60),
    pricePeak: String(program?.price_peak_rub ?? 0),
    priceOff: String(program?.price_offpeak_rub ?? 0),
    courts: String(program?.courts_needed ?? 1),
    maxPlayers:
      program?.max_players != null ? String(program.max_players) : "",
    description: program?.description ?? "",
    isActive: program?.is_active ?? true,
  };
}

export function ProgramForm({
  mode,
  program,
  defaultType,
  onCancel,
  onSubmit,
  pending,
  onDelete,
}: ProgramFormProps) {
  // State initialised once at mount; parent unmounts the form when
  // switching between create / edit / different row, so a prop-sync useEffect
  // here would only risk silently clobbering operator input.
  const [state, setState] = useState(() => makeInitial(program, defaultType));
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw: RawProgramInput = {
      name: state.name,
      type: state.type,
      duration_minutes: Number.parseInt(state.duration, 10),
      price_peak_rub: Number.parseInt(state.pricePeak, 10) || 0,
      price_offpeak_rub: Number.parseInt(state.priceOff, 10) || 0,
      courts_needed: Number.parseInt(state.courts, 10),
      max_players: state.maxPlayers
        ? Number.parseInt(state.maxPlayers, 10)
        : null,
      description: state.description,
      is_active: state.isActive,
    };
    const res = await onSubmit(raw);
    if ("error" in res && res.error) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 p-4 rounded-md bg-subtle border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,16rem)]">
        <Field label="Название">
          <Input
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Например, Турнир C-C+ на 12 игроков"
            autoFocus={mode === "create"}
          />
        </Field>
        <Field label="Тип">
          <Select
            value={state.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {ALL_PROGRAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            {!ALL_PROGRAM_TYPES.includes(state.type) && (
              <option value={state.type}>{state.type}</option>
            )}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Длительность, мин">
          <Input
            type="number"
            min={15}
            max={480}
            step={15}
            value={state.duration}
            onChange={(e) => set("duration", e.target.value)}
          />
        </Field>
        <Field label="Кортов">
          <Input
            type="number"
            min={1}
            max={10}
            value={state.courts}
            onChange={(e) => set("courts", e.target.value)}
          />
        </Field>
        <Field label="Макс. игроков">
          <Input
            type="number"
            min={1}
            max={64}
            value={state.maxPlayers}
            onChange={(e) => set("maxPlayers", e.target.value)}
            placeholder="—"
          />
        </Field>
        <div className="flex items-end pb-1">
          <label className="inline-flex items-center gap-2 text-sm text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Активна
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Цена пик, ₽">
          <Input
            type="number"
            min={0}
            value={state.pricePeak}
            onChange={(e) => set("pricePeak", e.target.value)}
          />
        </Field>
        <Field label="Цена вне пика, ₽">
          <Input
            type="number"
            min={0}
            value={state.priceOff}
            onChange={(e) => set("priceOff", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Описание / код">
        <Textarea
          rows={2}
          value={state.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Внутренний код или короткое описание"
        />
      </Field>

      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}

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
            Удалить
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
          {pending ? "Сохранение…" : mode === "create" ? "Создать" : "Сохранить"}
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
