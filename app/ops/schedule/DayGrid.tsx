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
import { todayIso } from "./date-helpers";
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
import { CurrentTimeLine } from "./CurrentTimeLine";

interface DayGridProps {
  date: string;
  courts: Court[];
  sessions: ScheduleSessionForGrid[];
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

export function DayGrid({
  date,
  courts,
  sessions,
  rentalBlocks,
  onEmptyCellClick,
  onSessionClick,
  onRentalClick,
}: DayGridProps) {
  const isToday = date === todayIso();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fluid vs. scroll: measure the wrapper and decide whether court columns
  // expand to fill width (≥ MIN_COURT_COL_WIDTH per court) or stay at the
  // fixed COURT_COL_WIDTH with horizontal scroll. Default to fixed for SSR.
  const [colWidth, setColWidth] = useState<number>(COURT_COL_WIDTH);
  useEffect(() => {
    const wrapper = scrollRef.current;
    if (!wrapper || courts.length === 0) return;
    const measure = () => {
      const available = wrapper.clientWidth - TIME_GUTTER_WIDTH;
      const perCourt = available / courts.length;
      setColWidth(
        perCourt >= MIN_COURT_COL_WIDTH
          ? Math.floor(perCourt)
          : COURT_COL_WIDTH,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [courts.length]);

  // courtId → column index — referenced by every session block.
  const courtIndex = useMemo(() => {
    const m = new Map<string, number>();
    courts.forEach((c, i) => m.set(c.id, i));
    return m;
  }, [courts]);

  // Sessions filtered to this date (server should already filter, but defend
  // against stale data in client transitions).
  const dateSessions = useMemo(
    () => sessions.filter((s) => s.date === date),
    [sessions, date],
  );
  const dateRentals = useMemo(
    () => rentalBlocks.filter((b) => b.date === date),
    [rentalBlocks, date],
  );

  // Precompute occupancy: every (slotIdx | courtId) intersection covered by
  // a non-cancelled session OR an active rental, so EmptyCell can flip to
  // non-interactive.
  const occupied = useMemo(() => {
    const set = new Set<string>();
    const addRange = (
      startTime: string,
      endTime: string,
      courtIds: string[],
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
        for (const cid of courtIds) {
          set.add(`${sl}|${cid}`);
        }
      }
    };
    for (const s of dateSessions) {
      if (s.status === "cancelled") continue;
      addRange(s.start_time, s.end_time, s.court_ids);
    }
    for (const b of dateRentals) {
      addRange(b.start_time, b.end_time, b.court_ids);
    }
    return set;
  }, [dateSessions, dateRentals]);

  const trackWidth = courts.length * colWidth;
  const totalWidth = TIME_GUTTER_WIDTH + trackWidth;
  const totalHeight = HEADER_HEIGHT + SLOTS_PER_DAY * ROW_HEIGHT;
  const isScrolling = colWidth === COURT_COL_WIDTH;

  if (courts.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">
          Нет активных кортов. Добавьте корт в разделе «Корты», чтобы строить
          расписание.
        </p>
      </div>
    );
  }

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
            Время
          </div>
          {courts.map((c) => (
            <div
              key={c.id}
              className={[
                "flex items-center justify-center text-xs font-semibold border-r border-border last:border-r-0",
                isToday ? "bg-accent-soft/40 text-accent" : "text-secondary",
              ].join(" ")}
              style={{ width: colWidth }}
            >
              {c.name}
            </div>
          ))}
        </div>

        {/* Time gutter — labels */}
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
                  isHourStart ? "border-t border-border" : "border-t border-border/30",
                  isPeak ? "text-[var(--color-warning)] font-semibold" : "text-fade",
                  isHourStart ? "" : "opacity-0",
                ].join(" ")}
                style={{ height: ROW_HEIGHT, paddingTop: 2 }}
              >
                {isHourStart ? time : ""}
              </div>
            );
          })}
        </div>

        {/* Cell grid — one EmptyCell per (slot × court) intersection */}
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
              <div
                key={slot}
                className="flex"
                style={{ height: ROW_HEIGHT }}
              >
                {courts.map((court) => {
                  const isOcc = occupied.has(`${slot}|${court.id}`);
                  return (
                    <div
                      key={court.id}
                      className="border-r border-border last:border-r-0"
                      style={{ width: colWidth }}
                    >
                      <EmptyCell
                        date={date}
                        time={time}
                        courtId={court.id}
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

        {/* Rental overlay layer — rendered BEFORE sessions so a rare
            same-court same-time session draws on top (the operator likely
            wants to see their just-edited session). */}
        <div className="absolute inset-0 pointer-events-none">
          {dateRentals.map((b) => {
            const indices: number[] = [];
            for (const cid of b.court_ids) {
              const i = courtIndex.get(cid);
              if (i !== undefined) indices.push(i);
            }
            if (indices.length === 0) return null;
            indices.sort((a, b) => a - b);
            const minIdx = indices[0];
            const maxIdx = indices[indices.length - 1];
            const colSpan = maxIdx - minIdx + 1;
            return (
              <div key={b.id} className="pointer-events-auto">
                <RentalBlock
                  block={b}
                  colIndex={minIdx}
                  colSpan={colSpan}
                  colWidth={colWidth}
                  showCourtSpan
                  onClick={onRentalClick}
                />
              </div>
            );
          })}
        </div>

        {/* Session blocks layer */}
        <div className="absolute inset-0 pointer-events-none">
          {dateSessions.map((s) => {
            const indices: number[] = [];
            for (const cid of s.court_ids) {
              const i = courtIndex.get(cid);
              if (i !== undefined) indices.push(i);
            }
            if (indices.length === 0) return null;
            indices.sort((a, b) => a - b);
            const minIdx = indices[0];
            const maxIdx = indices[indices.length - 1];
            const colSpan = maxIdx - minIdx + 1;
            const isContiguous = colSpan === indices.length;
            return (
              <div key={s.id} className="pointer-events-auto">
                <SessionBlock
                  session={s}
                  colIndex={minIdx}
                  colSpan={colSpan}
                  colWidth={colWidth}
                  spanLabelMode="courts"
                  nonContiguousCourtIndices={isContiguous ? undefined : indices}
                  onClick={onSessionClick}
                />
              </div>
            );
          })}
        </div>

        {/* Current-time line, rendered last so it sits above everything */}
        <CurrentTimeLine date={date} trackWidth={trackWidth} />
      </div>
    </div>
  );
}
