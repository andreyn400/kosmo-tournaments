"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { todayIso } from "../../coaches/format";
import type { RawExceptionInput } from "./slot-input";

interface ExceptionFormProps {
  onCancel: () => void;
  onSubmit: (raw: RawExceptionInput) => Promise<{ error?: string }>;
  pending: boolean;
}

export function ExceptionForm({
  onCancel,
  onSubmit,
  pending,
}: ExceptionFormProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<RawExceptionInput>({
    exception_type: "cancellation",
    from_date: todayIso(),
    to_date: todayIso(),
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RawExceptionInput>(
    key: K,
    value: RawExceptionInput[K],
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
      className="grid gap-3 p-3 rounded-md bg-surface border border-border"
    >
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
          {t("exception.field.type")}
        </span>
        <div className="flex gap-2">
          <TypeButton
            label={t("exception.type.cancellation_label")}
            description={t("exception.type.cancellation_hint")}
            active={state.exception_type === "cancellation"}
            onClick={() => set("exception_type", "cancellation")}
          />
          <TypeButton
            label={t("exception.type.pause_label")}
            description={t("exception.type.pause_hint")}
            active={state.exception_type === "pause"}
            onClick={() => {
              setState((s) => ({ ...s, exception_type: "pause" }));
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={
            state.exception_type === "cancellation"
              ? t("exception.field.date")
              : t("exception.field.from_date")
          }
        >
          <Input
            type="date"
            value={state.from_date}
            onChange={(e) => {
              const v = e.target.value;
              setState((s) => ({
                ...s,
                from_date: v,
                to_date:
                  s.exception_type === "cancellation"
                    ? v
                    : s.to_date < v
                      ? v
                      : s.to_date,
              }));
            }}
            className="!h-9"
          />
        </Field>
        {state.exception_type === "pause" && (
          <Field label={t("exception.field.to_date")}>
            <Input
              type="date"
              value={state.to_date}
              onChange={(e) => set("to_date", e.target.value)}
              className="!h-9"
            />
          </Field>
        )}
      </div>

      <Field label={t("exception.field.reason")}>
        <Input
          value={state.reason}
          onChange={(e) => set("reason", e.target.value)}
          placeholder={t("exception.placeholder.reason")}
          className="!h-9"
        />
      </Field>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex items-center gap-2 justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          {t("btn.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("exception.submitting") : t("exception.submit")}
        </Button>
      </div>
    </form>
  );
}

function TypeButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex-1 text-left rounded-md border-2 px-3 py-2 transition-colors",
        active
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:border-border-strong",
      ].join(" ")}
    >
      <div
        className={`text-xs font-semibold ${active ? "text-accent" : "text-black"}`}
      >
        {label}
      </div>
      <div className="text-[10px] text-muted">{description}</div>
    </button>
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
