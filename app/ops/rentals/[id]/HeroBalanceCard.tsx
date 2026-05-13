"use client";

import { formatRub } from "../../coaches/format";

interface HeroBalanceCardProps {
  totalValueRub: number;
  netReceivedRub: number;
  penaltiesRub: number;
  scheduledDueTodayRub: number;
  lastPaymentDate: string | null;
}

/**
 * Big colour-coded contract balance display. Three states:
 *   overdue       — should-have-paid > has-paid: red
 *   paid_ahead    — net-received > scheduled-due-today: green
 *   settled       — equal (or contract not yet started): neutral
 *
 * Also shows a breakdown row: получено, начислено, остаток, last-payment.
 */
export function HeroBalanceCard({
  totalValueRub,
  netReceivedRub,
  penaltiesRub,
  scheduledDueTodayRub,
  lastPaymentDate,
}: HeroBalanceCardProps) {
  const owedToDate = scheduledDueTodayRub + penaltiesRub;
  const overdueAmount = Math.max(0, owedToDate - netReceivedRub);
  const aheadAmount = Math.max(0, netReceivedRub - owedToDate);
  const remainingOutstanding =
    totalValueRub + penaltiesRub - netReceivedRub;

  const state: "overdue" | "ahead" | "settled" =
    overdueAmount > 0
      ? "overdue"
      : aheadAmount > 0
        ? "ahead"
        : "settled";

  const heroBg =
    state === "overdue"
      ? "bg-[var(--color-danger-soft)] border-[var(--color-danger)]/30"
      : state === "ahead"
        ? "bg-[var(--color-success-soft)] border-[var(--color-success)]/30"
        : "bg-subtle border-border";
  const heroValueCls =
    state === "overdue"
      ? "text-[var(--color-danger)]"
      : state === "ahead"
        ? "text-[var(--color-success)]"
        : "text-secondary";
  const heroLabel =
    state === "overdue"
      ? "Просрочено по контракту"
      : state === "ahead"
        ? "Предоплата"
        : "Расчёт сведён";
  const heroAmount =
    state === "overdue"
      ? formatRub(overdueAmount)
      : state === "ahead"
        ? formatRub(aheadAmount)
        : "0 ₽";

  return (
    <section
      className={`rounded-card border-2 p-5 grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] gap-4 ${heroBg}`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {heroLabel}
        </span>
        <span
          className={`text-3xl font-bold tabular-nums leading-none ${heroValueCls}`}
        >
          {heroAmount}
        </span>
        {state === "overdue" && (
          <span className="text-xs text-secondary mt-1">
            Клиент должен оплатить по графику до сегодняшнего дня.
          </span>
        )}
        {state === "ahead" && (
          <span className="text-xs text-secondary mt-1">
            Клиент заплатил больше, чем должно было прийти к этой дате.
          </span>
        )}
        {state === "settled" && (
          <span className="text-xs text-secondary mt-1">
            Все запланированные платежи поступили.
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 content-center">
        <Metric label="Стоимость" value={formatRub(totalValueRub)} />
        <Metric
          label="Получено"
          value={netReceivedRub > 0 ? formatRub(netReceivedRub) : "—"}
          tone={netReceivedRub > 0 ? "success" : undefined}
        />
        <Metric
          label="Начислено по графику"
          value={
            scheduledDueTodayRub > 0
              ? formatRub(scheduledDueTodayRub)
              : "—"
          }
        />
        <Metric
          label="Остаток"
          value={
            remainingOutstanding > 0
              ? formatRub(remainingOutstanding)
              : remainingOutstanding < 0
                ? `−${formatRub(-remainingOutstanding)}`
                : "0 ₽"
          }
          tone={
            remainingOutstanding > 0
              ? "danger"
              : remainingOutstanding < 0
                ? "success"
                : undefined
          }
        />
      </div>

      {lastPaymentDate && (
        <div className="md:col-span-2 text-[11px] text-muted -mt-1">
          Последний платёж: <span className="tabular-nums">{lastPaymentDate}</span>
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  const cls =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "danger"
        ? "text-[var(--color-danger)]"
        : "text-black";
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
        {label}
      </span>
      <span
        className={`text-base font-bold tabular-nums truncate ${cls}`}
      >
        {value}
      </span>
    </div>
  );
}
