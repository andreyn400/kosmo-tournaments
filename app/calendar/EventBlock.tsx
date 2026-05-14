"use client";

import type { CalendarEvent } from "@/lib/queries/calendar";
import {
  eventBlockStyle,
  eventSubtitle,
  eventTitle,
  type EventBlockStyle,
} from "@/lib/calendar-events";

type Density = "comfortable" | "compact" | "pill";

const RENTAL_STRIPE =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 14px)";

const MIN_HEIGHT_FOR_SUBTITLE = 40;

function statusBgClass(event: CalendarEvent): string {
  if (event.kind !== "tournament" && event.kind !== "league_session") {
    return "bg-white border-border";
  }
  const status = event.tournamentStatus;
  if (status === "in_progress") {
    return "bg-[color-mix(in_oklab,var(--color-accent)_14%,white)] border-[color-mix(in_oklab,var(--color-accent)_50%,white)]";
  }
  if (status === "completed") {
    return "bg-[var(--color-success-soft)] border-[color-mix(in_oklab,var(--color-success)_30%,white)]";
  }
  return "bg-white border-border";
}

function dotColor(style: EventBlockStyle): string {
  return style.useStatusStyle ? "var(--color-accent)" : style.background;
}

export function EventBlock({
  event,
  density = "comfortable",
  blockHeightPx,
  onClick,
}: {
  event: CalendarEvent;
  density?: Density;
  /** Rendered block height in px. Required for compact/comfortable to decide
   *  whether subtitle fits. Parents compute it from rowSpan × ROW_HEIGHT. */
  blockHeightPx?: number;
  onClick?: () => void;
}) {
  const title = eventTitle(event);
  const subtitle = eventSubtitle(event);
  const style = eventBlockStyle(event);

  if (density === "pill") {
    return (
      <PillBlock event={event} title={title} style={style} onClick={onClick} />
    );
  }

  const showSubtitle =
    density === "comfortable" &&
    !!subtitle &&
    (blockHeightPx ?? Number.POSITIVE_INFINITY) >= MIN_HEIGHT_FOR_SUBTITLE;

  if (style.useStatusStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full h-full overflow-hidden text-left rounded-[4px] border transition-colors hover:border-border-strong ${statusBgClass(event)}`}
      >
        <div
          className="flex items-start"
          style={{ gap: 4, padding: "4px 6px" }}
        >
          <span
            aria-hidden
            className="shrink-0 rounded-full"
            style={{
              width: 6,
              height: 6,
              marginTop: 5,
              background: dotColor(style),
            }}
          />
          <span
            className="truncate font-semibold text-black flex-1 min-w-0"
            style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
          >
            {title}
          </span>
        </div>
        {showSubtitle && (
          <div
            className="truncate text-muted"
            style={{
              padding: "0 6px 4px",
              fontSize: "0.7rem",
              lineHeight: 1.25,
            }}
          >
            {subtitle}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full h-full overflow-hidden text-left rounded-[4px] border border-transparent transition-[filter] hover:brightness-110"
      style={{ background: style.background }}
    >
      <div
        className="relative flex items-start"
        style={{ gap: 4, padding: "4px 6px", zIndex: 1 }}
      >
        {style.badge && (
          <span
            className="shrink-0 font-semibold uppercase tracking-wide"
            style={{
              fontSize: "0.6rem",
              background: "rgba(0,0,0,0.25)",
              color: "#ffffff",
              borderRadius: 3,
              padding: "1px 4px",
              lineHeight: 1.4,
            }}
          >
            {style.badge}
          </span>
        )}
        <span
          className="truncate font-semibold flex-1 min-w-0"
          style={{
            fontSize: "0.75rem",
            color: "#ffffff",
            lineHeight: 1.4,
          }}
        >
          {title}
        </span>
      </div>
      {showSubtitle && (
        <div
          className="relative truncate"
          style={{
            padding: "0 6px 4px",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.25,
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}
      {style.stripe && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: RENTAL_STRIPE }}
        />
      )}
    </button>
  );
}

function PillBlock({
  event,
  title,
  style,
  onClick,
}: {
  event: CalendarEvent;
  title: string;
  style: EventBlockStyle;
  onClick?: () => void;
}) {
  if (style.useStatusStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full overflow-hidden text-left rounded-[4px] border h-[18px] hover:brightness-105 ${statusBgClass(event)}`}
        style={{ padding: "0 6px" }}
      >
        <span className="flex items-center gap-1 min-w-0 h-full">
          <span
            aria-hidden
            className="shrink-0 rounded-full"
            style={{ width: 6, height: 6, background: dotColor(style) }}
          />
          <span
            className="font-medium text-black truncate flex-1 min-w-0"
            style={{ fontSize: "0.7rem", lineHeight: "16px" }}
          >
            {title}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden text-left rounded-[4px] border border-transparent h-[18px] hover:brightness-110"
      style={{ background: style.background, padding: "0 6px" }}
    >
      <span className="relative flex items-center min-w-0 h-full" style={{ zIndex: 1 }}>
        <span
          className="font-medium truncate flex-1 min-w-0"
          style={{
            fontSize: "0.7rem",
            lineHeight: "16px",
            color: "#ffffff",
          }}
        >
          {title}
        </span>
      </span>
      {style.stripe && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: RENTAL_STRIPE }}
        />
      )}
    </button>
  );
}
