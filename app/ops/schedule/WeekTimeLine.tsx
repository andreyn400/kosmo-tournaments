"use client";

import { useEffect, useState } from "react";
import {
  OPS_CLOSE_HOUR,
  OPS_OPEN_HOUR,
  OPS_SLOT_MINUTES,
} from "@/lib/ops-constants";
import { HEADER_HEIGHT, ROW_HEIGHT, TIME_GUTTER_WIDTH } from "./grid-constants";

interface WeekTimeLineProps {
  /** 0-based index of today's column in the week (0 = Mon, 6 = Sun). */
  colIndex: number;
  colWidth: number;
}

/**
 * Week-view current-time line. Sits inside today's column only — no gutter
 * dot, since the column itself is already highlighted by its header. Updates
 * every minute, suppressed outside open hours.
 */
export function WeekTimeLine({ colIndex, colWidth }: WeekTimeLineProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // SSR-safe time bootstrap (same pattern as CurrentTimeLine).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | null = null;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!now) return null;
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < OPS_OPEN_HOUR || h >= OPS_CLOSE_HOUR) return null;

  const minutesSinceOpen = (h - OPS_OPEN_HOUR) * 60 + m;
  const top =
    HEADER_HEIGHT + (minutesSinceOpen / OPS_SLOT_MINUTES) * ROW_HEIGHT;
  const left = TIME_GUTTER_WIDTH + colIndex * colWidth;

  return (
    <div
      aria-hidden
      className="absolute z-30 pointer-events-none"
      style={{
        top: top - 1,
        left,
        width: colWidth,
        height: 2,
        background: "var(--color-danger)",
      }}
    />
  );
}
