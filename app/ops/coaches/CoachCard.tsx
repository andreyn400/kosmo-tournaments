"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { CoachWithMonthlyStats } from "@/lib/queries/coaches";
import { formatRub } from "./format";

export function CoachCard({ coach }: { coach: CoachWithMonthlyStats }) {
  return (
    <Link
      href={`/ops/coaches/${coach.id}`}
      className={[
        "group rounded-card border bg-surface p-4 flex flex-col gap-3 transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        coach.is_active
          ? "border-border hover:border-border-strong"
          : "border-border opacity-70",
      ].join(" ")}
      style={{ borderLeft: `3px solid ${coach.color}` }}
    >
      <div className="flex items-start gap-3">
        <Avatar
          name={coach.name}
          photoUrl={coach.photo_url ?? undefined}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={[
                "text-sm font-semibold truncate",
                coach.is_active ? "text-black" : "text-fade",
              ].join(" ")}
              title={coach.name}
            >
              {coach.name}
            </h3>
            {coach.level && (
              <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold tracking-wider uppercase bg-subtle text-muted border border-border">
                {coach.level}
              </span>
            )}
            {!coach.is_active && (
              <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold tracking-wider uppercase bg-subtle text-muted border border-border">
                неактивен
              </span>
            )}
          </div>
          {coach.specialization && (
            <p className="text-xs text-muted mt-0.5 truncate">
              {coach.specialization}
            </p>
          )}
          {coach.phone && (
            <p className="text-[11px] text-fade font-mono mt-0.5 truncate">
              {coach.phone}
            </p>
          )}
        </div>
      </div>

      <RateBadge coach={coach} />

      <dl className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Stat label="Сессий" value={String(coach.monthSessions)} />
        <Stat
          label="Выручка"
          value={coach.monthRevenue > 0 ? formatRub(coach.monthRevenue) : "—"}
        />
        <Stat
          label="Выплата"
          value={
            coach.monthEarnings > 0 ? formatRub(coach.monthEarnings) : "—"
          }
          emphasize
        />
      </dl>
    </Link>
  );
}

function RateBadge({ coach }: { coach: CoachWithMonthlyStats }) {
  if (coach.rate_type === "flat") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 h-7 w-fit rounded-md bg-subtle border border-border text-xs">
        <span className="text-muted">Фикс.</span>
        <span className="text-black font-semibold tabular-nums">
          {formatRub(coach.flat_rate_rub)}
        </span>
        <span className="text-fade">/ сессия</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-2.5 h-7 w-fit rounded-md bg-subtle border border-border text-xs">
      <span className="text-muted">Процент:</span>
      <span className="text-black font-semibold tabular-nums">
        {coach.rate_court_percent}%
      </span>
      <span className="text-fade">корт</span>
      <span className="text-border" aria-hidden>
        •
      </span>
      <span className="text-black font-semibold tabular-nums">
        {coach.rate_coaching_percent}%
      </span>
      <span className="text-fade">тренировка</span>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span
        className={[
          "tabular-nums truncate",
          emphasize ? "text-accent font-semibold text-sm" : "text-black text-sm",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
