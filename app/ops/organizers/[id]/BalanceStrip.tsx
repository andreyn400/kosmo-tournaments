"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";

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
  const { t, lang } = useTranslation();
  const owes = balance > 0;
  const credit = balance < 0;

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
    ? t("organizer.balance.label.owes")
    : credit
      ? t("organizer.balance.label.credit")
      : t("organizer.balance.label.settled");
  const heroAmount = owes
    ? formatRub(balance, lang)
    : credit
      ? formatRub(-balance, lang)
      : "0 ₽";
  const heroHint = owes
    ? t("organizer.balance.hint.owes")
    : credit
      ? t("organizer.balance.hint.credit")
      : entryCount > 0
        ? t("organizer.balance.hint.all_covered")
        : t("organizer.balance.hint.no_entries");

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
          label={t("organizer.balance.breakdown.charges_label")}
          sublabel={t("organizer.balance.breakdown.charges_sublabel")}
          value={charges > 0 ? formatRub(charges, lang) : "—"}
          icon="↗"
          tone="neutral"
        />
        <Breakdown
          label={t("organizer.balance.breakdown.deposits_label")}
          sublabel={t("organizer.balance.breakdown.deposits_sublabel")}
          value={deposits > 0 ? formatRub(deposits, lang) : "—"}
          icon="↘"
          tone="success"
        />
        <Breakdown
          label={t("organizer.balance.breakdown.refunds_label")}
          sublabel={t("organizer.balance.breakdown.refunds_sublabel")}
          value={refunds > 0 ? formatRub(refunds, lang) : "—"}
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
