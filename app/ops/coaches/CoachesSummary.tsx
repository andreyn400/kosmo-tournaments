"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatMonthStr, formatRub } from "@/lib/i18n/format";
import type { CoachWithMonthlyStats } from "@/lib/queries/coaches";

interface CoachesSummaryProps {
  coaches: CoachWithMonthlyStats[];
  month: string;
}

export function CoachesSummary({ coaches, month }: CoachesSummaryProps) {
  const { t, tPlural, lang } = useTranslation();
  const total = coaches.length;
  const active = coaches.filter((c) => c.is_active).length;
  const monthSessions = coaches.reduce((acc, c) => acc + c.monthSessions, 0);
  const monthRevenue = coaches.reduce((acc, c) => acc + c.monthRevenue, 0);
  const monthPayout = coaches.reduce((acc, c) => acc + c.monthEarnings, 0);
  const coachWord = tPlural(total, {
    one: "coaches.coaches.one",
    few: "coaches.coaches.few",
    many: "coaches.coaches.many",
  });

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
      <Stat label={t("coaches.summary.total")} value={String(total)} suffix={coachWord} />
      <Sep />
      <Stat
        label={t("coaches.summary.active")}
        value={String(active)}
        tone={active > 0 ? "black" : "muted"}
      />
      <Sep />
      <Stat
        label={t("coaches.summary.month_sessions", {
          month: formatMonthStr(month, lang),
        })}
        value={String(monthSessions)}
      />
      <Sep />
      <Stat
        label={t("coaches.summary.revenue")}
        value={monthRevenue > 0 ? formatRub(monthRevenue, lang) : "—"}
      />
      <Sep />
      <Stat
        label={t("coaches.summary.payout_to_coaches")}
        value={monthPayout > 0 ? formatRub(monthPayout, lang) : "—"}
        tone="accent"
      />
    </div>
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
  tone?: "black" | "accent" | "muted";
}) {
  const valueClass =
    tone === "accent"
      ? "text-accent font-semibold"
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
