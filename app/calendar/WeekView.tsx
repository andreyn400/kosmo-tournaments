"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { CalendarEvent } from "@/lib/queries/calendar";
import {
  TOTAL_ROWS,
  assignLanes,
  eventRowSpan,
  eventRowStart,
  partitionTimed,
} from "@/lib/calendar-layout";
import {
  isoDateList,
  startOfWeekMon,
  todayIso,
  weekRange,
} from "@/lib/calendar-range";
import { EventBlock } from "./EventBlock";

const WEEKDAYS_SHORT_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOUR_LABELS = Array.from({ length: 17 }, (_, i) => 7 + i);

export function WeekView({
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
  const today = todayIso();
  const days = useMemo(() => {
    const { start, end } = weekRange(startOfWeekMon(date));
    return isoDateList(start, end);
  }, [date]);

  const { timed, untimed } = useMemo(() => partitionTimed(events), [events]);

  const untimedByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const d of days) map.set(d, []);
    for (const e of untimed) {
      const list = map.get(e.date);
      if (list) list.push(e);
    }
    return map;
  }, [untimed, days]);

  type Positioned = {
    event: CalendarEvent & { startTime: string };
    day: string;
    rowStart: number;
    rowSpan: number;
    laneIndex: number;
    laneCount: number;
  };

  const positioned: Positioned[] = useMemo(() => {
    const out: Positioned[] = [];
    for (const d of days) {
      const dayEvents = timed.filter((e) => e.date === d);
      const prelim = dayEvents.map((e) => {
        const rowStart = eventRowStart(e.startTime);
        const rowSpan = eventRowSpan(e.durationHours, rowStart);
        return { e, rowStart, rowSpan };
      });
      const lanes = assignLanes(prelim);
      prelim.forEach((p, i) => {
        out.push({
          event: p.e,
          day: d,
          rowStart: p.rowStart,
          rowSpan: p.rowSpan,
          laneIndex: lanes[i].laneIndex,
          laneCount: lanes[i].laneCount,
        });
      });
    }
    return out;
  }, [days, timed]);

  const maxUntimedPerDay = useMemo(() => {
    let max = 0;
    for (const d of days) {
      const n = untimedByDay.get(d)?.length ?? 0;
      if (n > max) max = n;
    }
    return max;
  }, [days, untimedByDay]);

  const gridTemplateColumns = `56px repeat(7, minmax(0, 1fr))`;
  const gridTemplateRows = `52px repeat(${TOTAL_ROWS}, 32px)`;

  return (
    <div className="flex flex-col gap-4">
      {maxUntimedPerDay > 0 && (
        <Card padded={false} className="p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Без времени
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}
          >
            <div />
            {days.map((d) => (
              <div
                key={`u-col:${d}`}
                className="flex flex-col gap-1 min-w-0"
              >
                {(untimedByDay.get(d) ?? []).map((e) => (
                  <div key={`u:${e.key}`} className="h-10">
                    <EventBlock
                      event={e}
                      density="compact"
                      blockHeightPx={40}
                      onClick={() => onSelectEvent?.(e)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="relative grid min-w-[720px]"
            style={{ gridTemplateColumns, gridTemplateRows }}
          >
            <div
              className="sticky top-0 z-20 bg-surface border-b border-border"
              style={{ gridArea: "1 / 1 / 2 / 2" }}
            />
            {days.map((d, i) => {
              const isToday = d === today;
              const dayNum = Number(d.split("-")[2]);
              return (
                <button
                  key={`head:${d}`}
                  type="button"
                  onClick={() => onNavigateToDay?.(d)}
                  className={`sticky top-0 z-10 flex flex-col items-center justify-center gap-0.5 border-b border-l border-border text-xs cursor-pointer transition-colors ${
                    isToday
                      ? "bg-[var(--color-accent-soft)] text-black hover:bg-[color-mix(in_oklab,var(--color-accent-soft)_80%,var(--color-accent)_8%)]"
                      : "bg-surface text-secondary hover:bg-subtle"
                  }`}
                  style={{ gridArea: `1 / ${i + 2} / 2 / ${i + 3}` }}
                >
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-muted">
                    {WEEKDAYS_SHORT_RU[i]}
                  </span>
                  <span
                    className={`text-base font-semibold ${isToday ? "text-accent" : "text-black"}`}
                  >
                    {dayNum}
                  </span>
                </button>
              );
            })}

            {HOUR_LABELS.map((h) => {
              const rowStart = (h - 7) * 2 + 2;
              return (
                <div
                  key={`hour:${h}`}
                  className="sticky left-0 z-10 flex items-start justify-end pr-2 pt-1 bg-surface text-[11px] text-muted border-r border-border"
                  style={{
                    gridArea: `${rowStart} / 1 / ${rowStart + 2} / 2`,
                  }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              );
            })}

            {days.map((d, colIdx) => {
              const isToday = d === today;
              return (
                <button
                  key={`bg:${d}`}
                  type="button"
                  onClick={() => onNavigateToDay?.(d)}
                  aria-label={`Открыть ${d} в режиме дня`}
                  className={`border-l border-border transition-colors ${
                    isToday
                      ? "bg-[color-mix(in_oklab,var(--color-accent-soft)_55%,white)] hover:bg-[color-mix(in_oklab,var(--color-accent-soft)_70%,white)]"
                      : "bg-transparent hover:bg-subtle/60"
                  }`}
                  style={{
                    gridArea: `2 / ${colIdx + 2} / ${TOTAL_ROWS + 2} / ${colIdx + 3}`,
                  }}
                />
              );
            })}

            {Array.from({ length: TOTAL_ROWS + 1 }, (_, i) => (
              <div
                key={`gridline:${i}`}
                className={`pointer-events-none ${i % 2 === 0 ? "border-t border-border" : "border-t border-dashed border-border/60"}`}
                style={{
                  gridArea: `${i + 2} / 2 / ${i + 3} / 9`,
                }}
              />
            ))}

            {positioned.map((p) => {
              const colIdx = days.indexOf(p.day);
              if (colIdx === -1) return null;
              const rowStart = p.rowStart + 2;
              const rowEnd = rowStart + p.rowSpan;
              const widthPct = 100 / p.laneCount;
              const leftPct = p.laneIndex * widthPct;
              const blockHeightPx = p.rowSpan * 32 - 4;
              return (
                <div
                  key={`${p.event.key}:${p.day}`}
                  className="relative z-10"
                  style={{
                    gridArea: `${rowStart} / ${colIdx + 2} / ${rowEnd} / ${colIdx + 3}`,
                  }}
                >
                  <div
                    className="absolute inset-y-0 p-0.5"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    <EventBlock
                      event={p.event}
                      density="compact"
                      blockHeightPx={blockHeightPx}
                      onClick={() => onSelectEvent?.(p.event)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
