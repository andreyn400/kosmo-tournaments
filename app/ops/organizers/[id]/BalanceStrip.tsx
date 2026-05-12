"use client";

import { formatRub } from "../../coaches/format";

interface BalanceStripProps {
  balance: number;
  charges: number;
  deposits: number;
  refunds: number;
  entryCount: number;
}

export function BalanceStrip({
  balance,
  charges,
  deposits,
  refunds,
  entryCount,
}: BalanceStripProps) {
  const owes = balance > 0;
  const credit = balance < 0;

  // The "hero" balance card switches color and label so the state reads at a glance.
  const heroBg = owes
    ? "bg-[var(--color-danger-soft)] border-[var(--color-danger)]/30"
    : credit
      ? "bg-[var(--color-success-soft)] border-[var(--color-success)]/30"
      : "bg-subtle border-border";
  const heroValue = owes
    ? "text-[var(--color-danger)]"
    : credit
      ? "text-[var(--color-success)]"
      : "text-secondary";
  const heroLabel = owes
    ? "Должен клубу"
    : credit
      ? "Кредит организатора"
      : "Расчёт сведён";
  const heroAmount = owes
    ? formatRub(balance)
    : credit
      ? formatRub(-balance)
      : "0 ₽";
  const heroHint = owes
    ? "Сумма, которую организатор должен оплатить."
    : credit
      ? "Сумма, оставшаяся на счёте организатора."
      : entryCount > 0
        ? "Все начисления покрыты."
        : "Записей пока нет.";

  return (
    <section className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <div
        className={`rounded-card border-2 p-5 flex flex-col gap-1 ${heroBg}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {heroLabel}
        </span>
        <span
          className={`text-3xl font-bold tabular-nums leading-none ${heroValue}`}
        >
          {heroAmount}
        </span>
        <span className="text-xs text-secondary mt-1">{heroHint}</span>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 grid grid-cols-3 gap-3">
        <Breakdown
          label="Начислено"
          sublabel="за корты / турниры"
          value={charges > 0 ? formatRub(charges) : "—"}
          icon="↗"
          tone="neutral"
        />
        <Breakdown
          label="Получено"
          sublabel="депозиты"
          value={deposits > 0 ? formatRub(deposits) : "—"}
          icon="↘"
          tone="success"
        />
        <Breakdown
          label="Возвращено"
          sublabel="refunds"
          value={refunds > 0 ? formatRub(refunds) : "—"}
          icon="↻"
          tone="warning"
        />
      </div>
    </section>
  );
}

function Breakdown({
  label,
  sublabel,
  value,
  icon,
  tone,
}: {
  label: string;
  sublabel: string;
  value: string;
  icon: string;
  tone: "neutral" | "success" | "warning";
}) {
  const iconCls =
    tone === "success"
      ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
      : tone === "warning"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : "bg-subtle text-secondary";

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${iconCls}`}
          aria-hidden
        >
          {icon}
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <span className="text-lg font-semibold text-black tabular-nums">
        {value}
      </span>
      <span className="text-[11px] text-fade">{sublabel}</span>
    </div>
  );
}
