"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Organizer, OrganizerPayment } from "@/lib/types";
import { LedgerRow } from "./LedgerRow";
import { PaymentForm } from "./PaymentForm";
import { createPaymentAction } from "./create-payment-action";
import type { RawPaymentInput } from "./payment-input";

interface LedgerPanelProps {
  organizer: Organizer;
  payments: OrganizerPayment[];
}

export function LedgerPanel({ organizer, payments }: LedgerPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(input: RawPaymentInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createPaymentAction(organizer.id, input);
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

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-black">Лента операций</h2>
        <span className="text-xs text-muted">
          {payments.length === 0 ? "Записей нет" : `Всего записей: ${payments.length}`}
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
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
          pending={pending}
        />
      )}

      {payments.length === 0 && !creating ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Записей пока нет. Добавьте первое начисление, депозит или возврат —
            баланс пересчитается сразу.
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
                <th className="px-2 py-2 text-left">Описание</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">
                  Корты
                </th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Часы</th>
                <th className="pl-2 pr-4 py-2 text-right whitespace-nowrap">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <LedgerRow
                  key={p.id}
                  organizer={organizer}
                  payment={p}
                  expanded={expandedId === p.id}
                  onToggle={() =>
                    setExpandedId(expandedId === p.id ? null : p.id)
                  }
                  zebra={i % 2 === 1}
                />
              ))}
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
        color="var(--color-danger)"
        label="Начисление"
        hint="увеличивает долг"
        sign="+"
      />
      <LegendItem
        color="var(--color-success)"
        label="Депозит"
        hint="уменьшает долг"
        sign="−"
      />
      <LegendItem
        color="var(--color-warning)"
        label="Возврат"
        hint="уменьшает долг"
        sign="−"
      />
    </div>
  );
}

function LegendItem({
  color,
  label,
  hint,
  sign,
}: {
  color: string;
  label: string;
  hint: string;
  sign: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-[10px] font-bold text-white"
        style={{ background: color }}
        aria-hidden
      >
        {sign}
      </span>
      <span className="font-semibold text-black">{label}</span>
      <span className="text-muted">— {hint}</span>
    </div>
  );
}
