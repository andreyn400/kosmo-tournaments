"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Organizer } from "@/lib/types";
import type { RawOrganizerInput } from "./organizer-input";

type Mode = "create" | "edit";

interface OrganizerFormProps {
  mode: Mode;
  organizer?: Organizer;
  onCancel: () => void;
  onSubmit: (input: RawOrganizerInput) => Promise<{ error?: string }>;
  pending: boolean;
  onDelete?: () => void;
}

function makeInitial(organizer?: Organizer): RawOrganizerInput {
  return {
    name: organizer?.name ?? "",
    contact_name: organizer?.contact_name ?? "",
    phone: organizer?.phone ?? "",
    email: organizer?.email ?? "",
    notes: organizer?.notes ?? "",
  };
}

export function OrganizerForm({
  mode,
  organizer,
  onCancel,
  onSubmit,
  pending,
  onDelete,
}: OrganizerFormProps) {
  const [state, setState] = useState<RawOrganizerInput>(() =>
    makeInitial(organizer),
  );
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RawOrganizerInput>(
    key: K,
    value: RawOrganizerInput[K],
  ) {
    setState((s) => ({ ...s, [key]: value }));
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
      className="grid gap-3 p-4 rounded-card border border-border bg-surface"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название организатора *">
          <Input
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="ИП Иванов / Padel Pro Russia"
            autoFocus
          />
        </Field>
        <Field label="Контактное лицо">
          <Input
            value={state.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
            placeholder="Иван Иванов"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Телефон">
          <Input
            value={state.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+7 …"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={state.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="org@example.com"
          />
        </Field>
      </div>

      <Field label="Заметки">
        <Textarea
          rows={3}
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Любая дополнительная информация: условия аренды, бронируемые корты…"
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
