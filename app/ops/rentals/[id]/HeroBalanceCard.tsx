"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";

interface HeroBalanceCardProps {
  totalValueRub: number;
  netReceivedRub: number;
  penaltiesRub: number;
  scheduledDueTodayRub: number;
  lastPaymentDate: string | null;
}

export function HeroBalanceCard({
  totalValueRub,
  netReceivedRub,
  penaltiesRub,
  scheduledDueTodayRub,
  lastPaymentDate,
}: HeroBalanceCardProps) {
  const { t, lang } = useTranslation();
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
      ? t("contract.hero.label.overdue")
      : state === "ahead"
        ? t("contract.hero.label.ahead")
        : t("contract.hero.label.settled");
  const heroAmount =
    state === "overdue"
      ? formatRub(overdueAmount, lang)
      : state === "ahead"
        ? formatRub(aheadAmount, lang)
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
            {t("contract.hero.hint.overdue")}
          </span>
        )}
        {state === "ahead" && (
          <span className="text-xs text-secondary mt-1">
            {t("contract.hero.hint.ahead")}
          </span>
        )}
        {state === "settled" && (
          <span className="text-xs text-secondary mt-1">
            {t("contract.hero.hint.settled")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 content-center">
        <Metric
          label={t("contract.hero.metric.total")}
          value={formatRub(totalValueRub, lang)}
        />
        <Metric
          label={t("contract.hero.metric.received")}
          value={netReceivedRub > 0 ? formatRub(netReceivedRub, lang) : "—"}
          tone={netReceivedRub > 0 ? "success" : undefined}
        />
        <Metric
          label={t("contract.hero.metric.scheduled")}
          value={
            scheduledDueTodayRub > 0
              ? formatRub(scheduledDueTodayRub, lang)
              : "—"
          }
        />
        <Metric
          label={t("contract.hero.metric.remaining")}
          value={
            remainingOutstanding > 0
              ? formatRub(remainingOutstanding, lang)
              : remainingOutstanding < 0
                ? `−${formatRub(-remainingOutstanding, lang)}`
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
          {t("contract.hero.last_payment", { date: lastPaymentDate })}
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
