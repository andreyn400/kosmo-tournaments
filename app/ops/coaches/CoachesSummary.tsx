"use client";

import type { CoachWithMonthlyStats } from "@/lib/queries/coaches";
import { formatMonth, formatRub } from "./format";

interface CoachesSummaryProps {
  coaches: CoachWithMonthlyStats[];
  month: string;
}

export function CoachesSummary({ coaches, month }: CoachesSummaryProps) {
  const total = coaches.length;
  const active = coaches.filter((c) => c.is_active).length;
  const monthSessions = coaches.reduce(
    (acc, c) => acc + c.monthSessions,
    0,
  );
  const monthRevenue = coaches.reduce((acc, c) => acc + c.monthRevenue, 0);
  const monthPayout = coaches.reduce((acc, c) => acc + c.monthEarnings, 0);

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
      <Stat label="Всего" value={String(total)} suffix={pluralCoaches(total)} />
      <Sep />
      <Stat
        label="Активных"
        value={String(active)}
        tone={active > 0 ? "black" : "muted"}
      />
      <Sep />
      <Stat
        label={`${formatMonth(month)}, сессий`}
        value={String(monthSessions)}
      />
      <Sep />
      <Stat
        label="Выручка"
        value={monthRevenue > 0 ? formatRub(monthRevenue) : "—"}
      />
      <Sep />
      <Stat
        label="Выплачено тренерам"
        value={monthPayout > 0 ? formatRub(monthPayout) : "—"}
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

function pluralCoaches(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "тренеров";
  if (mod10 === 1) return "тренер";
  if (mod10 >= 2 && mod10 <= 4) return "тренера";
  return "тренеров";
}
