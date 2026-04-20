"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { CalendarEvent } from "@/lib/queries/calendar";
import type { Court } from "@/lib/types";
import {
  TOTAL_ROWS,
  eventRowSpan,
  eventRowStart,
  partitionTimed,
} from "@/lib/calendar-layout";
import { todayIso } from "@/lib/calendar-range";
import { EventBlock } from "./EventBlock";

const HOUR_LABELS = Array.from({ length: 17 }, (_, i) => 7 + i); // 7..23
const NO_COURT = "__no_court__" as const;

type ColumnSpec =
  | { kind: "court"; court: Court }
  | { kind: "none" };

export function DayView({
  date,
  events,
  courts,
  onSelectEvent,
}: {
  date: string;
  events: CalendarEvent[];
  courts: Court[];
  onSelectEvent?: (event: CalendarEvent) => void;
}) {
  const isToday = date === todayIso();

  const sortedCourts = useMemo(
    () => [...courts].sort((a, b) => a.number - b.number),
    [courts],
  );
  const activeIds = useMemo(
    () => new Set(sortedCourts.map((c) => c.id)),
    [sortedCourts],
  );

  const { timed, untimed } = useMemo(() => partitionTimed(events), [events]);

  const needsNoCourt = useMemo(() => {
    for (const e of events) {
      const any = e.courtIds.some((id) => activeIds.has(id));
      if (!any) return true;
    }
    return false;
  }, [events, activeIds]);

  const columns: ColumnSpec[] = useMemo(() => {
    const cols: ColumnSpec[] = sortedCourts.map((c) => ({
      kind: "court",
      court: c,
    }));
    if (needsNoCourt) cols.push({ kind: "none" });
    return cols;
  }, [sortedCourts, needsNoCourt]);

  type Placed = {
    event: CalendarEvent & { startTime: string };
    columnKey: string;
    rowStart: number;
    rowSpan: number;
  };

  const placed: Placed[] = useMemo(() => {
    const out: Placed[] = [];
    for (const e of timed) {
      const assigned = e.courtIds.filter((id) => activeIds.has(id));
      const targets =
        assigned.length > 0 ? assigned : needsNoCourt ? [NO_COURT] : [];
      for (const columnKey of targets) {
        const rowStart = eventRowStart(e.startTime);
        const rowSpan = eventRowSpan(e.durationHours, rowStart);
        out.push({ event: e, columnKey, rowStart, rowSpan });
      }
    }
    return out;
  }, [timed, activeIds, needsNoCourt]);

  const untimedForColumns: Array<{ event: CalendarEvent; columnKey: string }> =
    useMemo(() => {
      const out: Array<{ event: CalendarEvent; columnKey: string }> = [];
      for (const e of untimed) {
        const assigned = e.courtIds.filter((id) => activeIds.has(id));
        const targets =
          assigned.length > 0 ? assigned : needsNoCourt ? [NO_COURT] : [];
        for (const columnKey of targets) out.push({ event: e, columnKey });
      }
      return out;
    }, [untimed, activeIds, needsNoCourt]);

  if (columns.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center gap-2 py-16">
        <p className="text-base font-semibold text-black">Нет активных кортов</p>
        <p className="text-xs text-muted">
          Добавьте корты, чтобы видеть сетку расписания.
        </p>
      </Card>
    );
  }

  const columnKey = (c: ColumnSpec) => (c.kind === "court" ? c.court.id : NO_COURT);
  const columnLabel = (c: ColumnSpec) =>
    c.kind === "court" ? `Корт ${c.court.number}` : "Без корта";

  const gridTemplateColumns = `56px repeat(${columns.length}, minmax(120px, 1fr))`;
  const gridTemplateRows = `40px repeat(${TOTAL_ROWS}, 32px)`;

  return (
    <div className="flex flex-col gap-4">
      {untimedForColumns.length > 0 && (
        <Card padded={false} className="p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
            Без времени
          </div>
          <div className="flex flex-col gap-1.5">
            {untimedForColumns.map(({ event, columnKey: ck }) => {
              const col = columns.find((c) => columnKey(c) === ck);
              const tag = col ? columnLabel(col) : "Без корта";
              return (
                <div
                  key={`${event.key}:${ck}`}
                  className="flex items-stretch gap-2"
                >
                  <div className="w-24 shrink-0 flex items-center">
                    <span className="text-[11px] text-muted truncate">{tag}</span>
                  </div>
                  <div className="flex-1 min-w-0 h-10">
                    <EventBlock
                      event={event}
                      density="compact"
                      onClick={() => onSelectEvent?.(event)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="relative grid min-w-[640px]"
            style={{ gridTemplateColumns, gridTemplateRows }}
          >
            <div
              className="sticky top-0 z-20 bg-surface border-b border-border"
              style={{ gridArea: "1 / 1 / 2 / 2" }}
            />
            {columns.map((c, i) => (
              <div
                key={`head:${columnKey(c)}`}
                className={`sticky top-0 z-10 flex items-center justify-center border-b border-l border-border text-xs font-semibold ${
                  isToday ? "bg-[var(--color-accent-soft)] text-black" : "bg-surface text-secondary"
                }`}
                style={{ gridArea: `1 / ${i + 2} / 2 / ${i + 3}` }}
              >
                {columnLabel(c)}
              </div>
            ))}

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

            {columns.map((c, colIdx) => (
              <div
                key={`bg:${columnKey(c)}`}
                className={`border-l border-border ${
                  isToday ? "bg-[color-mix(in_oklab,var(--color-accent-soft)_55%,white)]" : ""
                }`}
                style={{
                  gridArea: `2 / ${colIdx + 2} / ${TOTAL_ROWS + 2} / ${colIdx + 3}`,
                }}
              />
            ))}

            {Array.from({ length: TOTAL_ROWS + 1 }, (_, i) => (
              <div
                key={`gridline:${i}`}
                className={`pointer-events-none ${i % 2 === 0 ? "border-t border-border" : "border-t border-dashed border-border/60"}`}
                style={{
                  gridArea: `${i + 2} / 2 / ${i + 3} / ${columns.length + 2}`,
                }}
              />
            ))}

            {placed.map((p) => {
              const colIdx = columns.findIndex((c) => columnKey(c) === p.columnKey);
              if (colIdx === -1) return null;
              const rowStart = p.rowStart + 2;
              const rowEnd = rowStart + p.rowSpan;
              return (
                <div
                  key={`${p.event.key}:${p.columnKey}`}
                  className="relative z-10 p-0.5"
                  style={{
                    gridArea: `${rowStart} / ${colIdx + 2} / ${rowEnd} / ${colIdx + 3}`,
                  }}
                >
                  <EventBlock
                    event={p.event}
                    onClick={() => onSelectEvent?.(p.event)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
