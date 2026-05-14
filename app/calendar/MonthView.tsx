"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/i18n/useTranslation";
import { getWeekdayShortLabels } from "@/lib/i18n/format";
import type { CalendarEvent } from "@/lib/queries/calendar";
import {
  isoDateList,
  monthGridRange,
  todayIso,
} from "@/lib/calendar-range";
import { minutesFromHHMM } from "@/lib/calendar-layout";
import { EventBlock } from "./EventBlock";

const MAX_PILLS = 3;

type Cell = {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
};

export function MonthView({
  date,
  events,
  onSelectEvent,
  onNavigateToDay,
}: {
  date: string;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onNavigateToDay?: (iso: string) => void;
}) {
  const { t, lang } = useTranslation();
  const weekdaysShort = getWeekdayShortLabels(lang);
  const today = todayIso();
  const currentMonth = Number(date.split("-")[1]);

  const cells: Cell[] = useMemo(() => {
    const { start, end } = monthGridRange(date);
    const days = isoDateList(start, end);
    const byDay = new Map<string, CalendarEvent[]>();
    for (const d of days) byDay.set(d, []);
    for (const e of events) {
      const list = byDay.get(e.date);
      if (list) list.push(e);
    }
    for (const list of byDay.values()) {
      list.sort((a, b) => {
        const am = a.startTime ? minutesFromHHMM(a.startTime) : -1;
        const bm = b.startTime ? minutesFromHHMM(b.startTime) : -1;
        return am - bm;
      });
    }
    return days.map((iso) => {
      const m = Number(iso.split("-")[1]);
      return {
        iso,
        dayNum: Number(iso.split("-")[2]),
        inMonth: m === currentMonth,
        isToday: iso === today,
        events: byDay.get(iso) ?? [],
      };
    });
  }, [date, events, currentMonth, today]);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-subtle">
        {weekdaysShort.map((w) => (
          <div
            key={w}
            className="px-2 py-2 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-muted text-center"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const hidden = cell.events.length - MAX_PILLS;
          const isSunday = i % 7 === 6;
          const isLastRow = i >= cells.length - 7;
          return (
            <div
              key={cell.iso}
              className={`flex flex-col gap-1 p-1.5 min-h-[72px] md:min-h-[96px] border-border ${
                isSunday ? "" : "border-r"
              } ${isLastRow ? "" : "border-b"} ${
                cell.inMonth ? "bg-surface" : "bg-subtle/50"
              }`}
            >
              <button
                type="button"
                onClick={() => onNavigateToDay?.(cell.iso)}
                className="self-start inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <span
                  className={
                    cell.isToday
                      ? "inline-flex items-center justify-center h-[22px] min-w-[22px] px-1 -m-1 rounded-full bg-accent text-white font-semibold"
                      : cell.inMonth
                        ? "font-semibold text-black hover:text-accent"
                        : "text-fade hover:text-muted"
                  }
                >
                  {cell.dayNum}
                </span>
              </button>
              <div className="flex flex-col gap-0.5 min-w-0">
                {cell.events.slice(0, MAX_PILLS).map((e) => (
                  <EventBlock
                    key={`${e.key}:${cell.iso}`}
                    event={e}
                    density="pill"
                    onClick={() => onSelectEvent?.(e)}
                  />
                ))}
                {hidden > 0 ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToDay?.(cell.iso)}
                    className="self-start text-[10.5px] text-muted hover:text-accent px-1"
                  >
                    {t("calendar.more_count", { count: hidden })}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
