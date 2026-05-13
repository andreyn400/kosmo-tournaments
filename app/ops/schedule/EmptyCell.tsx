"use client";

interface EmptyCellProps {
  date: string;
  time: string; // HH:MM
  courtId: string;
  isPeak: boolean;
  isHourStart: boolean;
  isOccupied: boolean;
  onClick: (
    date: string,
    time: string,
    courtId: string,
    anchor: DOMRect,
  ) => void;
}

/**
 * One grid cell representing a 30-min slot on one court. Cells under a
 * session block (`isOccupied`) become non-interactive — the block on top
 * captures the click. Empty cells offer a soft hover + plus glyph and route
 * clicks to the create-popover.
 *
 * Peak rows (17:00–22:00) get a warning-tinted background; hour-start rows
 * get a heavier top border so the eye groups slots into hours.
 */
export function EmptyCell({
  date,
  time,
  courtId,
  isPeak,
  isHourStart,
  isOccupied,
  onClick,
}: EmptyCellProps) {
  if (isOccupied) {
    return (
      <div
        aria-hidden
        className={[
          "h-full w-full",
          isPeak ? "bg-[var(--color-warning-soft)]/30" : "",
          isHourStart ? "border-t border-border" : "border-t border-border/30",
        ].join(" ")}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) =>
        onClick(date, time, courtId, e.currentTarget.getBoundingClientRect())
      }
      aria-label={`Создать сессию ${time} · корт`}
      className={[
        "group h-full w-full text-left transition-colors focus:outline-none focus-visible:bg-accent-soft",
        isPeak
          ? "bg-[var(--color-warning-soft)]/40 hover:bg-accent-soft"
          : "bg-surface hover:bg-accent-soft",
        isHourStart ? "border-t border-border" : "border-t border-border/30",
      ].join(" ")}
    >
      <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity inline-flex items-center gap-1 pl-2 pt-1 text-[10px] font-semibold tracking-wider text-accent">
        <PlusIcon />
        <span className="tabular-nums">{time}</span>
      </span>
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
