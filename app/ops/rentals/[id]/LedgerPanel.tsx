"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type {
  RentalPayment,
  RentalPaymentMethod,
  RentalPaymentScheduleEntry,
  RentalPaymentType,
} from "@/lib/types";
import { formatDateRu, formatRub, todayIso } from "../../coaches/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
} from "../format";
import {
  createPaymentAction,
  deletePaymentAction,
  updatePaymentAction,
} from "./payment-actions";
import type { RawRentalPaymentInput } from "./payment-input";

interface LedgerPanelProps {
  contractId: string;
  payments: RentalPayment[];
  schedule: RentalPaymentScheduleEntry[];
}

export function LedgerPanel({
  contractId,
  payments,
  schedule,
}: LedgerPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(
    raw: RawRentalPaymentInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createPaymentAction(contractId, raw);
        if (res.id) {
          setCreating(false);
          router.refresh();
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  function handleUpdate(
    paymentId: string,
    raw: RawRentalPaymentInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updatePaymentAction(contractId, paymentId, raw);
        if (!res.error) {
          setEditingId(null);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  async function handleDelete(paymentId: string) {
    if (!confirm("Удалить эту запись из ленты платежей?")) return;
    startTransition(async () => {
      const res = await deletePaymentAction(contractId, paymentId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-black">Лента платежей</h2>
        <span className="text-xs text-muted">
          {payments.length === 0
            ? "Записей нет"
            : `Всего записей: ${payments.length}`}
        </span>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="ml-auto"
        >
          + Добавить запись
        </Button>
      </header>

      <LegendBar />

      {creating && (
        <PaymentForm
          mode="create"
          schedule={schedule}
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
          pending={pending}
        />
      )}

      {payments.length === 0 && !creating ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            Записей пока нет. Платежи, депозит, возвраты и штрафы — всё в
            одной ленте.
          </p>
        </div>
      ) : payments.length > 0 ? (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
                <th className="pl-4 pr-2 py-2 text-left whitespace-nowrap">
                  Дата
                </th>
                <th className="px-2 py-2 text-left">Тип</th>
                <th className="px-2 py-2 text-left">Период / Описание</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">
                  Способ
                </th>
                <th className="px-2 py-2 text-left whitespace-nowrap">№ док.</th>
                <th className="pl-2 pr-4 py-2 text-right whitespace-nowrap">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const linked = p.schedule_id
                  ? schedule.find((s) => s.id === p.schedule_id) ?? null
                  : null;
                return (
                  <Fragment key={p.id}>
                    <LedgerRow
                      payment={p}
                      linkedSchedule={linked}
                      expanded={editingId === p.id}
                      zebra={i % 2 === 1}
                      onToggle={() =>
                        setEditingId(editingId === p.id ? null : p.id)
                      }
                    />
                    {editingId === p.id && (
                      <tr className="bg-subtle/30">
                        <td colSpan={6} className="p-2 border-y border-border">
                          <PaymentForm
                            mode="edit"
                            payment={p}
                            schedule={schedule}
                            onCancel={() => setEditingId(null)}
                            onSubmit={(raw) => handleUpdate(p.id, raw)}
                            onDelete={() => handleDelete(p.id)}
                            pending={pending}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function LegendBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-secondary">
      <LegendItem
        color="var(--color-success)"
        label="Платёж"
        hint="клиент оплатил"
      />
      <LegendItem
        color="var(--color-success)"
        label="Депозит"
        hint="оплата вперёд"
      />
      <LegendItem
        color="var(--color-danger)"
        label="Штраф"
        hint="дополнительное начисление"
      />
      <LegendItem
        color="var(--color-warning)"
        label="Возврат"
        hint="возвращено клиенту"
      />
    </div>
  );
}

function LegendItem({
  color,
  label,
  hint,
}: {
  color: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
        aria-hidden
      />
      <span className="font-semibold text-black">{label}</span>
      <span className="text-muted">— {hint}</span>
    </div>
  );
}

function LedgerRow({
  payment: p,
  linkedSchedule,
  expanded,
  zebra,
  onToggle,
}: {
  payment: RentalPayment;
  linkedSchedule: RentalPaymentScheduleEntry | null;
  expanded: boolean;
  zebra: boolean;
  onToggle: () => void;
}) {
  // Sign + colour by type. Convention: positive sign = adds to what client
  // owes (penalty, refund); negative sign = reduces what client owes
  // (payment, deposit).
  const t = p.payment_type;
  const isInflow = t === "payment" || t === "deposit";
  const sign = isInflow ? "−" : "+";
  const amountCls = isInflow
    ? "text-[var(--color-success)]"
    : t === "penalty"
      ? "text-[var(--color-danger)]"
      : "text-[var(--color-warning)]";

  const rowBg = expanded
    ? "bg-accent-soft/50"
    : zebra
      ? "bg-subtle/40 hover:bg-subtle"
      : "hover:bg-subtle";

  return (
    <tr
      onClick={onToggle}
      className={`cursor-pointer transition-colors ${rowBg}`}
      style={{ height: "44px" }}
    >
      <td className="pl-4 pr-2 align-middle text-xs tabular-nums whitespace-nowrap text-black">
        {formatDateRu(p.payment_date)}
      </td>
      <td className="px-2 align-middle">
        <TypePill type={p.payment_type} />
      </td>
      <td className="px-2 align-middle text-xs text-secondary min-w-0">
        {linkedSchedule ? (
          <span className="text-black truncate block max-w-[28ch]">
            {linkedSchedule.period_label}
          </span>
        ) : p.notes ? (
          <span className="truncate block max-w-[28ch]" title={p.notes}>
            {p.notes}
          </span>
        ) : (
          <span className="text-fade italic">—</span>
        )}
      </td>
      <td className="px-2 align-middle text-xs text-secondary whitespace-nowrap">
        {p.method ? PAYMENT_METHOD_LABELS[p.method] : "—"}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums whitespace-nowrap">
        {p.invoice_number || "—"}
      </td>
      <td
        className={`pl-2 pr-4 align-middle text-sm font-bold tabular-nums text-right whitespace-nowrap ${amountCls}`}
      >
        {sign}
        {formatRub(p.amount_rub)}
      </td>
    </tr>
  );
}

function TypePill({ type }: { type: RentalPaymentType }) {
  const map: Record<RentalPaymentType, { bg: string; text: string }> = {
    payment: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
    },
    deposit: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
    },
    penalty: {
      bg: "bg-[var(--color-danger-soft)]",
      text: "text-[var(--color-danger)]",
    },
    refund: {
      bg: "bg-[var(--color-warning-soft)]",
      text: "text-[var(--color-warning)]",
    },
  };
  const cfg = map[type];
  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {PAYMENT_TYPE_LABELS[type]}
    </span>
  );
}

function PaymentForm({
  mode,
  payment,
  schedule,
  onCancel,
  onSubmit,
  onDelete,
  pending,
}: {
  mode: "create" | "edit";
  payment?: RentalPayment;
  schedule: RentalPaymentScheduleEntry[];
  onCancel: () => void;
  onSubmit: (raw: RawRentalPaymentInput) => Promise<{ error?: string }>;
  onDelete?: () => void;
  pending: boolean;
}) {
  const [state, setState] = useState<RawRentalPaymentInput>({
    schedule_id: payment?.schedule_id ?? "",
    payment_date: payment?.payment_date ?? todayIso(),
    amount_rub: payment ? String(payment.amount_rub) : "",
    payment_type: payment?.payment_type ?? "payment",
    method: (payment?.method as RentalPaymentMethod | null) ?? "transfer",
    invoice_number: payment?.invoice_number ?? "",
    notes: payment?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RawRentalPaymentInput>(
    key: K,
    value: RawRentalPaymentInput[K],
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
      onClick={(e) => e.stopPropagation()}
      className="grid gap-3 p-3 rounded-md bg-surface border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Тип">
          <Select
            value={state.payment_type}
            onChange={(e) =>
              set("payment_type", e.target.value as RentalPaymentType)
            }
            className="!h-9"
          >
            {(
              Object.keys(PAYMENT_TYPE_LABELS) as RentalPaymentType[]
            ).map((t) => (
              <option key={t} value={t}>
                {PAYMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Дата">
          <Input
            type="date"
            value={state.payment_date}
            onChange={(e) => set("payment_date", e.target.value)}
            className="!h-9"
          />
        </Field>
        <Field label="Сумма, ₽">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={state.amount_rub}
            onChange={(e) => set("amount_rub", e.target.value)}
            className="!h-9"
            autoFocus={mode === "create"}
          />
        </Field>
        <Field label="Способ">
          <Select
            value={state.method}
            onChange={(e) =>
              set("method", e.target.value as RentalPaymentMethod)
            }
            className="!h-9"
          >
            {(
              Object.keys(
                PAYMENT_METHOD_LABELS,
              ) as RentalPaymentMethod[]
            ).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {state.payment_type === "payment" && schedule.length > 0 && (
        <Field label="Период (необязательно)">
          <Select
            value={state.schedule_id}
            onChange={(e) => set("schedule_id", e.target.value)}
            className="!h-9"
          >
            <option value="">Не привязан</option>
            {schedule.map((s) => (
              <option key={s.id} value={s.id}>
                {s.period_label} — {s.due_date} — {formatRub(s.amount_due_rub)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <Field label="№ документа">
          <Input
            value={state.invoice_number}
            onChange={(e) => set("invoice_number", e.target.value)}
            placeholder="ПП-1234"
            className="!h-9"
          />
        </Field>
        <Field label="Заметка">
          <Textarea
            rows={2}
            value={state.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </div>

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
