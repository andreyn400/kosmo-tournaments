"use client";

import { useEffect, useState } from "react";
import {
  OPS_CLOSE_HOUR,
  OPS_OPEN_HOUR,
  OPS_SLOT_MINUTES,
} from "@/lib/ops-constants";
import { HEADER_HEIGHT, ROW_HEIGHT, TIME_GUTTER_WIDTH } from "./grid-constants";

interface CurrentTimeLineProps {
  /** YYYY-MM-DD the grid is showing. Line only renders if this is today. */
  date: string;
  /** Width of the grid track minus the time gutter (so the line stretches
   *  across all court columns but doesn't overlap the gutter). */
  trackWidth: number;
}

/**
 * Red 2 px horizontal line at "now", plus a small "now" dot in the time
 * gutter. Updates every minute. Suppressed when the grid isn't showing today
 * or when the wall clock is outside the open-hours window.
 */
export function CurrentTimeLine({ date, trackWidth }: CurrentTimeLineProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Initialise on mount so SSR output is empty (avoids hydration mismatch),
  // then tick once per minute aligned to wall-clock minute boundaries.
  useEffect(() => {
    // SSR-safe time bootstrap — Date() during render would mismatch the
    // server-rendered HTML. This is the canonical mount-time pattern.
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

  const isoNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  if (isoNow !== date) return null;

  const h = now.getHours();
  const m = now.getMinutes();
  if (h < OPS_OPEN_HOUR || h >= OPS_CLOSE_HOUR) return null;

  const minutesSinceOpen = (h - OPS_OPEN_HOUR) * 60 + m;
  const top =
    HEADER_HEIGHT + (minutesSinceOpen / OPS_SLOT_MINUTES) * ROW_HEIGHT;

  return (
    <>
      {/* Dot in the gutter */}
      <div
        aria-hidden
        className="absolute z-30 pointer-events-none"
        style={{
          top: top - 5,
          left: TIME_GUTTER_WIDTH - 10,
          width: 10,
          height: 10,
          background: "var(--color-danger)",
          borderRadius: "50%",
          boxShadow: "0 0 0 2px var(--color-surface)",
        }}
      />
      {/* Line across courts */}
      <div
        aria-hidden
        className="absolute z-30 pointer-events-none"
        style={{
          top: top - 1,
          left: TIME_GUTTER_WIDTH,
          width: trackWidth,
          height: 2,
          background: "var(--color-danger)",
        }}
      />
    </>
  );
}
