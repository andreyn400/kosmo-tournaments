"use client";

import type { Coach, ScheduleSessionWithMeta } from "@/lib/types";
import { computeEarnings } from "@/lib/coach-earnings";
import { formatRub } from "../format";

interface MonthlyStripProps {
  coach: Coach;
  sessions: ScheduleSessionWithMeta[];
}

export function MonthlyStrip({ coach, sessions }: MonthlyStripProps) {
  const live = sessions.filter((s) => s.status !== "cancelled");
  const count = live.length;
  const revenue = live.reduce((acc, s) => acc + s.revenue_rub, 0);
  const court = live.reduce((acc, s) => acc + s.court_revenue_rub, 0);
  const coachingFee = live.reduce((acc, s) => acc + s.coaching_fee_rub, 0);
  const payout = live.reduce((acc, s) => acc + computeEarnings(coach, s), 0);
  const clubNet = revenue - payout;

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 grid grid-cols-2 sm:grid-cols-6 gap-4">
      <Metric label="Сессий" value={String(count)} />
      <Metric
        label="Выручка"
        value={revenue > 0 ? formatRub(revenue) : "—"}
      />
      <Metric label="Корт" value={court > 0 ? formatRub(court) : "—"} muted />
      <Metric
        label="Тренировка"
        value={coachingFee > 0 ? formatRub(coachingFee) : "—"}
        muted
      />
      <Metric
        label="Тренеру"
        value={payout > 0 ? formatRub(payout) : "—"}
        tone="accent"
      />
      <Metric
        label="Клубу"
        value={clubNet > 0 ? formatRub(clubNet) : revenue > 0 ? "—" : "—"}
        tone="success"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "black",
  muted,
}: {
  label: string;
  value: string;
  tone?: "black" | "accent" | "success";
  muted?: boolean;
}) {
  const valueClass =
    tone === "accent"
      ? "text-accent font-semibold"
      : tone === "success"
        ? "text-[var(--color-success)] font-semibold"
        : muted
          ? "text-secondary font-medium"
          : "text-black font-semibold";
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
        {label}
      </span>
      <span className={`text-sm tabular-nums truncate ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
