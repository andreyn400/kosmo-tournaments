"use client";

import type { CalendarEvent } from "@/lib/queries/calendar";
import { FORMAT_LABEL_RU } from "@/lib/constants";
import { formatTimeRange } from "@/lib/calendar-layout";
import { formatTimeRu } from "@/lib/format-date";

type Density = "comfortable" | "compact" | "pill";

function statusClass(status: CalendarEvent["tournamentStatus"]): string {
  if (status === "in_progress") {
    return "bg-[color-mix(in_oklab,var(--color-accent)_14%,white)] border-[color-mix(in_oklab,var(--color-accent)_50%,white)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-accent before:rounded-l-[inherit]";
  }
  if (status === "completed") {
    return "bg-[var(--color-success-soft)] border-[color-mix(in_oklab,var(--color-success)_30%,white)]";
  }
  return "bg-white border-border";
}

export function EventBlock({
  event,
  density = "comfortable",
  onClick,
}: {
  event: CalendarEvent;
  density?: Density;
  onClick?: () => void;
}) {
  if (density === "pill") {
    const t = formatTimeRu(event.startTime);
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full block overflow-hidden text-left rounded-[4px] border px-1.5 h-[18px] leading-[16px] text-[10.5px] hover:border-border-strong ${statusClass(event.tournamentStatus)}`}
      >
        <span className="truncate block">
          {t ? (
            <span className="text-muted tabular-nums mr-1">{t}</span>
          ) : null}
          <span className="font-medium text-black">{event.tournamentName}</span>
        </span>
      </button>
    );
  }

  const timeLabel = event.startTime
    ? formatTimeRange(event.startTime, event.durationHours)
    : "Без времени";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden text-left rounded-md border px-2 py-1.5 transition-colors hover:border-border-strong ${statusClass(event.tournamentStatus)}`}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-xs font-semibold text-black truncate">
          {event.tournamentName}
        </div>
        {density === "comfortable" && (
          <>
            <div className="text-[11px] text-muted truncate">{timeLabel}</div>
            <div className="text-[11px] text-muted truncate">
              {FORMAT_LABEL_RU[event.format]}
            </div>
          </>
        )}
      </div>
    </button>
  );
}
