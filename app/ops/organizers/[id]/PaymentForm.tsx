"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { OrganizerPayment, OrganizerPaymentType } from "@/lib/types";
import { todayIso } from "../../coaches/format";
import {
  PAYMENT_TYPE_DESCRIPTIONS,
  PAYMENT_TYPE_LABELS,
  type RawPaymentInput,
} from "./payment-input";

type Mode = "create" | "edit";

interface PaymentFormProps {
  mode: Mode;
  payment?: OrganizerPayment;
  onCancel: () => void;
  onSubmit: (input: RawPaymentInput) => Promise<{ error?: string }>;
  pending: boolean;
  onDelete?: () => void;
}

function makeInitial(payment?: OrganizerPayment): RawPaymentInput {
  if (payment) {
    return {
      date: payment.date,
      amount_rub: String(payment.amount_rub),
      type: payment.type,
      courts_booked:
        payment.courts_booked != null ? String(payment.courts_booked) : "",
      hours_booked:
        payment.hours_booked != null ? String(payment.hours_booked) : "",
      notes: payment.notes ?? "",
    };
  }
  return {
    date: todayIso(),
    amount_rub: "",
    type: "payment",
    courts_booked: "",
    hours_booked: "",
    notes: "",
  };
}

export function PaymentForm({
  mode,
  payment,
  onCancel,
  onSubmit,
  pending,
  onDelete,
}: PaymentFormProps) {
  const [state, setState] = useState<RawPaymentInput>(() =>
    makeInitial(payment),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(makeInitial(payment));
    setError(null);
  }, [payment]);

  function set<K extends keyof RawPaymentInput>(
    key: K,
    value: RawPaymentInput[K],
  ) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await onSubmit(state);
    if (res.error) setError(res.error);
  }

  const isCharge = state.type === "payment";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 p-4 rounded-md bg-subtle border border-border"
    >
      <div>
        <Label>Тип записи</Label>
        <div className="grid gap-2 sm:grid-cols-3 mt-1.5">
          <TypeRadio
            value="payment"
            current={state.type}
            onChange={(v) => set("type", v)}
            label={PAYMENT_TYPE_LABELS.payment}
            description={PAYMENT_TYPE_DESCRIPTIONS.payment}
            tone="danger"
          />
          <TypeRadio
            value="deposit"
            current={state.type}
            onChange={(v) => set("type", v)}
            label={PAYMENT_TYPE_LABELS.deposit}
            description={PAYMENT_TYPE_DESCRIPTIONS.deposit}
            tone="success"
          />
          <TypeRadio
            value="refund"
            current={state.type}
            onChange={(v) => set("type", v)}
            label={PAYMENT_TYPE_LABELS.refund}
            description={PAYMENT_TYPE_DESCRIPTIONS.refund}
            tone="warning"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label="Дата">
          <Input
            type="date"
            value={state.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>
        <Field label="Сумма, ₽">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={state.amount_rub}
            onChange={(e) => set("amount_rub", e.target.value)}
            placeholder="0"
            autoFocus={mode === "create"}
          />
        </Field>
      </div>

      {isCharge && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Кортов">
            <Input
              type="number"
              min={0}
              max={99}
              value={state.courts_booked}
              onChange={(e) => set("courts_booked", e.target.value)}
              placeholder="2"
            />
          </Field>
          <Field label="Часов">
            <Input
              type="number"
              min={0}
              max={999}
              step="0.5"
              value={state.hours_booked}
              onChange={(e) => set("hours_booked", e.target.value)}
              placeholder="4"
            />
          </Field>
        </div>
      )}

      <Field label="Описание">
        <Textarea
          rows={2}
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={
            isCharge
              ? "Например: турнир 18 мая, 2 корта × 4 часа"
              : "Например: предоплата на май, наличные"
          }
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
              ? "Записать"
              : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function TypeRadio({
  value,
  current,
  onChange,
  label,
  description,
  tone,
}: {
  value: OrganizerPaymentType;
  current: OrganizerPaymentType;
  onChange: (v: OrganizerPaymentType) => void;
  label: string;
  description: string;
  tone: "danger" | "success" | "warning";
}) {
  const on = current === value;
  const toneBorder = on
    ? tone === "danger"
      ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
      : tone === "success"
        ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
        : "border-[var(--color-warning)] bg-[var(--color-warning-soft)]"
    : "border-border bg-surface hover:border-border-strong";

  const toneLabel =
    tone === "danger"
      ? "text-[var(--color-danger)]"
      : tone === "success"
        ? "text-[var(--color-success)]"
        : "text-[var(--color-warning)]";

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={on}
      className={`text-left rounded-md border-2 p-3 transition-colors ${toneBorder}`}
    >
      <div className={`text-sm font-semibold ${on ? toneLabel : "text-black"}`}>
        {label}
      </div>
      <div className="text-[11px] text-muted leading-snug mt-0.5">
        {description}
      </div>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}
