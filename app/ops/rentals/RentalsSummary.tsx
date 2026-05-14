"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import type { RentalContractWithSummary } from "@/lib/types";

interface RentalsSummaryProps {
  contracts: RentalContractWithSummary[];
}

export function RentalsSummary({ contracts }: RentalsSummaryProps) {
  const { t, tPlural, lang } = useTranslation();
  const total = contracts.length;
  const active = contracts.filter((c) => c.status === "active").length;
  const overdueList = contracts.filter((c) => c.overdue_rub > 0);
  const overdueCount = overdueList.length;
  const overdueAmount = overdueList.reduce(
    (acc, c) => acc + c.overdue_rub,
    0,
  );
  const monthlyRecurring = contracts
    .filter((c) => c.status === "active")
    .reduce((acc, c) => {
      const months = monthsBetween(c.start_date, c.end_date);
      return acc + (months > 0 ? Math.round(c.total_value_rub / months) : 0);
    }, 0);

  const contractWord = tPlural(total, {
    one: "rentals.contracts.one",
    few: "rentals.contracts.few",
    many: "rentals.contracts.many",
  });

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
      <Stat
        label={t("rentals.summary.contracts")}
        value={String(total)}
        suffix={contractWord}
      />
      <Sep />
      <Stat
        label={t("rentals.summary.active")}
        value={String(active)}
        tone={active > 0 ? "black" : "muted"}
      />
      <Sep />
      <Stat
        label={t("rentals.summary.overdue")}
        value={
          overdueCount > 0
            ? `${overdueCount} · ${formatRub(overdueAmount, lang)}`
            : "—"
        }
        tone={overdueCount > 0 ? "danger" : "muted"}
      />
      <Sep />
      <Stat
        label={t("rentals.summary.monthly_run_rate")}
        value={monthlyRecurring > 0 ? formatRub(monthlyRecurring, lang) : "—"}
        tone="success"
      />
    </div>
  );
}

function monthsBetween(startIso: string, endIso: string): number {
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  return Math.max(
    1,
    (e.getFullYear() - s.getFullYear()) * 12 +
      (e.getMonth() - s.getMonth()) +
      1,
  );
}

function Stat({
  label,
  value,
  suffix,
  tone = "black",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "black" | "danger" | "success" | "muted";
}) {
  const valueClass =
    tone === "danger"
      ? "text-[var(--color-danger)] font-semibold"
      : tone === "success"
        ? "text-[var(--color-success)] font-semibold"
        : tone === "muted"
          ? "text-muted font-semibold"
          : "text-black font-semibold";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted">{label}:</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
      {suffix && <span className="text-muted">{suffix}</span>}
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-fade">
      ·
    </span>
  );
}
