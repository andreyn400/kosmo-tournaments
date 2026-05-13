"use client";

import type { CalendarEvent } from "@/lib/queries/calendar";
import {
  eventBlockStyle,
  eventSubtitle,
  eventTitle,
} from "@/lib/calendar-events";
import { formatTimeRange } from "@/lib/calendar-layout";
import { formatTimeRu } from "@/lib/format-date";

type Density = "comfortable" | "compact" | "pill";

const RENTAL_STRIPE =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 14px)";

function statusClass(event: CalendarEvent): string {
  if (event.kind !== "tournament" && event.kind !== "league_session") {
    return "bg-white border-border";
  }
  const status = event.tournamentStatus;
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
  const title = eventTitle(event);
  const subtitle = eventSubtitle(event);
  const style = eventBlockStyle(event);

  if (density === "pill") {
    return (
      <PillBlock
        event={event}
        title={title}
        onClick={onClick}
        useStatusStyle={style.useStatusStyle}
        background={style.background}
        ink={style.ink}
        stripe={style.stripe}
        badge={style.badge}
      />
    );
  }

  const timeLabel = event.startTime
    ? formatTimeRange(event.startTime, event.durationHours)
    : "Без времени";

  if (style.useStatusStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full h-full overflow-hidden text-left rounded-md border px-2 py-1.5 transition-colors hover:border-border-strong ${statusClass(event)}`}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-xs font-semibold text-black truncate">
            {title}
          </div>
          {density === "comfortable" && (
            <>
              <div className="text-[11px] text-muted truncate">{timeLabel}</div>
              {subtitle && (
                <div className="text-[11px] text-muted truncate">
                  {subtitle}
                </div>
              )}
            </>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full h-full overflow-hidden text-left rounded-md border border-transparent px-2 py-1.5 transition-[filter] hover:brightness-110"
      style={{
        background: style.background,
        backgroundImage: style.stripe ? RENTAL_STRIPE : undefined,
        color: style.ink,
      }}
    >
      {style.badge && (
        <span
          className="absolute top-1 right-1 px-1 h-[14px] inline-flex items-center justify-center rounded-[3px] bg-white/25 text-[9px] font-semibold tracking-wider uppercase leading-none"
          style={{ color: style.ink }}
        >
          {style.badge}
        </span>
      )}
      <div className="flex flex-col gap-0.5 min-w-0 pr-10">
        <div
          className="text-xs font-semibold truncate"
          style={{ color: style.ink }}
        >
          {title}
        </div>
        {density === "comfortable" && (
          <>
            <div
              className="text-[11px] truncate opacity-90"
              style={{ color: style.ink }}
            >
              {timeLabel}
            </div>
            {subtitle && (
              <div
                className="text-[11px] truncate opacity-90"
                style={{ color: style.ink }}
              >
                {subtitle}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

function PillBlock({
  event,
  title,
  onClick,
  useStatusStyle,
  background,
  ink,
  stripe,
  badge,
}: {
  event: CalendarEvent;
  title: string;
  onClick?: () => void;
  useStatusStyle: boolean;
  background: string;
  ink: string;
  stripe: boolean;
  badge: string | null;
}) {
  const t = formatTimeRu(event.startTime);

  if (useStatusStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full block overflow-hidden text-left rounded-[4px] border px-1.5 h-[18px] leading-[16px] text-[10.5px] hover:border-border-strong ${statusClass(event)}`}
      >
        <span className="truncate block">
          {t ? (
            <span className="text-muted tabular-nums mr-1">{t}</span>
          ) : null}
          <span className="font-medium text-black">{title}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full block overflow-hidden text-left rounded-[4px] border border-transparent px-1.5 h-[18px] leading-[16px] text-[10.5px] hover:brightness-110"
      style={{
        background,
        backgroundImage: stripe ? RENTAL_STRIPE : undefined,
        color: ink,
      }}
      title={badge ? `${badge}: ${title}` : title}
    >
      <span className="truncate block">
        {t ? (
          <span
            className="tabular-nums mr-1 opacity-90"
            style={{ color: ink }}
          >
            {t}
          </span>
        ) : null}
        <span className="font-semibold" style={{ color: ink }}>
          {title}
        </span>
      </span>
    </button>
  );
}
