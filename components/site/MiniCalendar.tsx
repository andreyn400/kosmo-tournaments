"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatMonth, getWeekdayShortLabels } from "@/lib/i18n/format";
import type { EventKind } from "@/lib/queries/calendar";
import { MINI_CALENDAR_KIND_COLOR } from "@/lib/calendar-events";

function toIso(year: number, monthZeroBased: number, day: number): string {
  const mm = String(monthZeroBased + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function MiniCalendar({
  eventKindsByDate,
}: {
  eventKindsByDate: Record<string, EventKind[]>;
}) {
  const { t, lang } = useTranslation();
  const weekdaysShort = getWeekdayShortLabels(lang);
  const today = useMemo(() => new Date(), []);
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const cells = useMemo(() => {
    const firstOfMonth = new Date(view.year, view.month, 1);
    const jsWeekday = firstOfMonth.getDay();
    const startPad = (jsWeekday + 6) % 7;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

    const out: Array<{
      key: string;
      day: number | null;
      iso: string | null;
      isToday: boolean;
      kinds: EventKind[];
    }> = [];
    for (let i = 0; i < startPad; i++) {
      out.push({
        key: `pad-${i}`,
        day: null,
        iso: null,
        isToday: false,
        kinds: [],
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIso(view.year, view.month, d);
      out.push({
        key: iso,
        day: d,
        iso,
        isToday: iso === todayIso,
        kinds: eventKindsByDate[iso] ?? [],
      });
    }
    while (out.length % 7 !== 0) {
      out.push({
        key: `tail-${out.length}`,
        day: null,
        iso: null,
        isToday: false,
        kinds: [],
      });
    }
    return out;
  }, [view, eventKindsByDate, todayIso]);

  const prev = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  const next = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  const goToday = () =>
    setView({ year: today.getFullYear(), month: today.getMonth() });

  const isCurrentMonthView =
    view.year === today.getFullYear() && view.month === today.getMonth();

  return (
    <div className="px-3 pb-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <button
          type="button"
          onClick={prev}
          aria-label={t("calendar.mini.aria.prev_month")}
          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted hover:text-black hover:bg-subtle"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={goToday}
          disabled={isCurrentMonthView}
          aria-label={t("calendar.mini.aria.current_month")}
          className="text-[11px] font-semibold text-black uppercase tracking-wide tabular-nums px-1.5 rounded hover:bg-subtle disabled:hover:bg-transparent disabled:cursor-default"
        >
          {formatMonth(view.year, view.month, lang)}
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={t("calendar.mini.aria.next_month")}
          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted hover:text-black hover:bg-subtle"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium text-fade uppercase tracking-wider mb-1">
        {weekdaysShort.map((w) => (
          <span key={w} className="py-0.5">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          if (cell.day == null) {
            return <span key={cell.key} className="h-8" aria-hidden />;
          }
          const hasEvent = cell.kinds.length > 0;
          const base =
            "relative h-8 flex flex-col items-center justify-center gap-0.5 text-[11px] tabular-nums rounded transition-colors";
          const tone = cell.isToday
            ? "bg-accent text-white font-semibold hover:bg-[var(--color-accent-hover)]"
            : hasEvent
              ? "text-black font-semibold hover:bg-subtle"
              : "text-muted hover:bg-subtle";
          return (
            <Link
              key={cell.key}
              href={`/calendar?view=day&date=${cell.iso}`}
              className={`${base} ${tone}`}
              title={hasEvent ? t("calendar.mini.has_events") : undefined}
            >
              <span className="leading-none">{cell.day}</span>
              {hasEvent && !cell.isToday ? (
                <span
                  aria-hidden
                  className="flex flex-row gap-[2px] h-[3px] mt-px"
                >
                  {cell.kinds.slice(0, 4).map((k) => (
                    <span
                      key={k}
                      className="h-[3px] w-[3px] rounded-full"
                      style={{ background: MINI_CALENDAR_KIND_COLOR[k] }}
                    />
                  ))}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
