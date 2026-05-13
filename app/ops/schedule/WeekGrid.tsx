"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Court,
  RentalBlockForGrid,
  ScheduleSessionForGrid,
} from "@/lib/types";
import {
  OPS_OPEN_HOUR,
  OPS_SLOT_MINUTES,
  PEAK_END_HOUR,
  PEAK_START_HOUR,
  SLOTS_PER_DAY,
  minutesFromTime,
  timeFromSlotIndex,
} from "@/lib/ops-constants";
import {
  formatDayHeader,
  todayIso,
  weekDays,
  weekMondayIso,
} from "./date-helpers";
import {
  COURT_COL_WIDTH,
  HEADER_HEIGHT,
  MIN_COURT_COL_WIDTH,
  ROW_HEIGHT,
  TIME_GUTTER_WIDTH,
} from "./grid-constants";
import { EmptyCell } from "./EmptyCell";
import { SessionBlock } from "./SessionBlock";
import { RentalBlock } from "./RentalBlock";
import { WeekTimeLine } from "./WeekTimeLine";

interface WeekGridProps {
  /** Any date in the week to display. Internally clamped to the week's Monday. */
  date: string;
  courts: Court[];
  /** Selected court id (filter). */
  courtId: string;
  /** All sessions for the week range. */
  sessions: ScheduleSessionForGrid[];
  /** All rental block instances for the week range. */
  rentalBlocks: RentalBlockForGrid[];
  onEmptyCellClick: (
    date: string,
    time: string,
    courtId: string,
    anchor: DOMRect,
  ) => void;
  onSessionClick: (
    session: ScheduleSessionForGrid,
    anchor: DOMRect,
  ) => void;
  onRentalClick: (
    block: RentalBlockForGrid,
    anchor: DOMRect,
  ) => void;
}

/**
 * Week view: columns = 7 days (Mon..Sun) for one selected court. Reuses the
 * same row geometry as `DayGrid`. Multi-court sessions still appear here as
 * long as the selected court is in their `court_ids`; the in-block courts
 * label is suppressed (operators see this view *to scan one court*, so
 * repeating "К1" everywhere would be noise).
 */
export function WeekGrid({
  date,
  courts,
  courtId,
  sessions,
  rentalBlocks,
  onEmptyCellClick,
  onSessionClick,
  onRentalClick,
}: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayIso();

  const mondayIso = useMemo(() => weekMondayIso(date), [date]);
  const days = useMemo(() => weekDays(mondayIso), [mondayIso]);

  // date → 0..6 column index
  const dayIndex = useMemo(() => {
    const m = new Map<string, number>();
    days.forEach((d, i) => m.set(d, i));
    return m;
  }, [days]);

  // Fluid / scroll mode mirrors DayGrid.
  const [colWidth, setColWidth] = useState<number>(COURT_COL_WIDTH);
  useEffect(() => {
    const wrapper = scrollRef.current;
    if (!wrapper) return;
    const measure = () => {
      const available = wrapper.clientWidth - TIME_GUTTER_WIDTH;
      const perDay = available / 7;
      setColWidth(
        perDay >= MIN_COURT_COL_WIDTH ? Math.floor(perDay) : COURT_COL_WIDTH,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Filter sessions + rentals to the selected court for the week range.
  const courtSessions = useMemo(
    () =>
      sessions.filter(
        (s) => s.court_ids.includes(courtId) && dayIndex.has(s.date),
      ),
    [sessions, courtId, dayIndex],
  );
  const courtRentals = useMemo(
    () =>
      rentalBlocks.filter(
        (b) => b.court_ids.includes(courtId) && dayIndex.has(b.date),
      ),
    [rentalBlocks, courtId, dayIndex],
  );

  // Per-(slot|day) occupancy mask so empty cells under blocks go inert.
  // Sessions and rentals contribute equally — rentals are read-only but
  // they still block scheduler-create attempts on those cells.
  const occupied = useMemo(() => {
    const set = new Set<string>();
    const addRange = (
      d: string,
      startTime: string,
      endTime: string,
    ) => {
      const startMin = minutesFromTime(startTime);
      const endMin = minutesFromTime(endTime);
      const startSlot = Math.floor(
        (startMin - OPS_OPEN_HOUR * 60) / OPS_SLOT_MINUTES,
      );
      const endSlot = Math.ceil(
        (endMin - OPS_OPEN_HOUR * 60) / OPS_SLOT_MINUTES,
      );
      for (let sl = startSlot; sl < endSlot; sl++) {
        set.add(`${sl}|${d}`);
      }
    };
    for (const s of courtSessions) {
      if (s.status === "cancelled") continue;
      addRange(s.date, s.start_time, s.end_time);
    }
    for (const b of courtRentals) {
      addRange(b.date, b.start_time, b.end_time);
    }
    return set;
  }, [courtSessions, courtRentals]);

  const trackWidth = 7 * colWidth;
  const totalWidth = TIME_GUTTER_WIDTH + trackWidth;
  const totalHeight = HEADER_HEIGHT + SLOTS_PER_DAY * ROW_HEIGHT;
  const isScrolling = colWidth === COURT_COL_WIDTH;

  // Subtitle: which court are we looking at?
  const courtName = courts.find((c) => c.id === courtId)?.name ?? "—";

  // Current-time line lives on the today-column only. Compute its left offset
  // by the column index; pass a custom track width that's just one column wide.
  const todayIdx = dayIndex.get(today);

  return (
    <div
      ref={scrollRef}
      className={`rounded-card border border-border bg-surface ${isScrolling ? "overflow-x-auto" : "overflow-x-hidden"}`}
    >
      <div
        className="relative"
        style={{ width: totalWidth, height: totalHeight }}
      >
        {/* Header row */}
        <div
          className="absolute top-0 left-0 right-0 flex border-b border-border bg-subtle/40 z-20"
          style={{ height: HEADER_HEIGHT }}
        >
          <div
            className="flex items-center justify-center text-[10.5px] font-semibold uppercase tracking-wider text-muted border-r border-border"
            style={{ width: TIME_GUTTER_WIDTH }}
          >
            {courtName}
          </div>
          {days.map((d) => {
            const { dow, day } = formatDayHeader(d);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 border-r border-border last:border-r-0 leading-none",
                  isToday
                    ? "bg-accent-soft/50 text-accent"
                    : "text-secondary",
                ].join(" ")}
                style={{ width: colWidth }}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">
                  {dow}
                </span>
                <span className="text-sm font-bold tabular-nums">{day}</span>
              </div>
            );
          })}
        </div>

        {/* Time gutter */}
        <div
          className="absolute left-0 z-10"
          style={{ top: HEADER_HEIGHT, width: TIME_GUTTER_WIDTH }}
        >
          {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => {
            const time = timeFromSlotIndex(slot);
            const isHourStart = time.endsWith(":00");
            const hour = Number.parseInt(time.slice(0, 2), 10);
            const isPeak = hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
            return (
              <div
                key={slot}
                className={[
                  "flex items-start justify-end pr-2 text-[10px] tabular-nums border-r border-border",
                  isHourStart
                    ? "border-t border-border"
                    : "border-t border-border/30",
                  isPeak
                    ? "text-[var(--color-warning)] font-semibold"
                    : "text-fade",
                  isHourStart ? "" : "opacity-0",
                ].join(" ")}
                style={{ height: ROW_HEIGHT, paddingTop: 2 }}
              >
                {isHourStart ? time : ""}
              </div>
            );
          })}
        </div>

        {/* Cell grid */}
        <div
          className="absolute"
          style={{
            top: HEADER_HEIGHT,
            left: TIME_GUTTER_WIDTH,
            width: trackWidth,
          }}
        >
          {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => {
            const time = timeFromSlotIndex(slot);
            const hour = Number.parseInt(time.slice(0, 2), 10);
            const isPeak = hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
            const isHourStart = time.endsWith(":00");
            return (
              <div key={slot} className="flex" style={{ height: ROW_HEIGHT }}>
                {days.map((d) => {
                  const isOcc = occupied.has(`${slot}|${d}`);
                  return (
                    <div
                      key={d}
                      className="border-r border-border last:border-r-0"
                      style={{ width: colWidth }}
                    >
                      <EmptyCell
                        date={d}
                        time={time}
                        courtId={courtId}
                        isPeak={isPeak}
                        isHourStart={isHourStart}
                        isOccupied={isOcc}
                        onClick={onEmptyCellClick}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Rental overlay layer — sits below sessions so an exceptional
            same-cell session would draw on top. */}
        <div className="absolute inset-0 pointer-events-none">
          {courtRentals.map((b) => {
            const idx = dayIndex.get(b.date);
            if (idx === undefined) return null;
            return (
              <div key={b.id} className="pointer-events-auto">
                <RentalBlock
                  block={b}
                  colIndex={idx}
                  colSpan={1}
                  colWidth={colWidth}
                  showCourtSpan={false}
                  onClick={onRentalClick}
                />
              </div>
            );
          })}
        </div>

        {/* Session blocks layer */}
        <div className="absolute inset-0 pointer-events-none">
          {courtSessions.map((s) => {
            const idx = dayIndex.get(s.date);
            if (idx === undefined) return null;
            return (
              <div key={s.id} className="pointer-events-auto">
                <SessionBlock
                  session={s}
                  colIndex={idx}
                  colSpan={1}
                  colWidth={colWidth}
                  spanLabelMode="none"
                  onClick={onSessionClick}
                />
              </div>
            );
          })}
        </div>

        {/* Current-time line — scoped to today's column. Drawn via a custom
            element rather than the gutter-spanning CurrentTimeLine so the
            line sits inside the one day column rather than across all 7. */}
        {todayIdx !== undefined && (
          <WeekTimeLine
            colIndex={todayIdx}
            colWidth={colWidth}
          />
        )}
      </div>
    </div>
  );
}
