"use client";

import type { ScheduleSessionForGrid, SessionCoachChip } from "@/lib/types";
import { programTypeColor } from "@/lib/program-colors";
import { minutesFromTime, OPS_OPEN_HOUR } from "@/lib/ops-constants";
import {
  BLOCK_BOTTOM_GAP,
  HEADER_HEIGHT,
  MIN_BLOCK_HEIGHT,
  ROW_HEIGHT,
  TIME_GUTTER_WIDTH,
} from "./grid-constants";

interface SessionBlockProps {
  session: ScheduleSessionForGrid;
  /** 0-based column index where the block starts. */
  colIndex: number;
  /** Number of columns the block spans (≥ 1). */
  colSpan: number;
  /** Live column width (fluid in wide viewports, fixed in scroll mode). */
  colWidth: number;
  /** Day view = "courts" (shows "К1–К3" or "К1, К3"); week view = "none". */
  spanLabelMode: "courts" | "none";
  /** Day view only: non-contiguous court indices, rendered as "К1, К3". */
  nonContiguousCourtIndices?: number[];
  onClick: (session: ScheduleSessionForGrid, anchor: DOMRect) => void;
}

/**
 * One absolute-positioned coloured block. Geometry is purely a function of
 * the resolved (colIndex, colSpan) — the caller decides what a "column"
 * means (a court in day view, a day in week view). All pixel math is read
 * from `grid-constants` so the block stays aligned with the empty-cell grid.
 */
export function SessionBlock({
  session,
  colIndex,
  colSpan,
  colWidth,
  spanLabelMode,
  nonContiguousCourtIndices,
  onClick,
}: SessionBlockProps) {
  // Slot math: time → minutes since open → slot fraction. Sub-slot durations
  // (e.g. 45 min) are honoured pixel-exactly by using fractional slot heights.
  const startMin = minutesFromTime(session.start_time);
  const endMin = minutesFromTime(session.end_time);
  const startSlotFrac = (startMin - OPS_OPEN_HOUR * 60) / 30;
  const slotSpanFrac = (endMin - startMin) / 30;

  const top = HEADER_HEIGHT + startSlotFrac * ROW_HEIGHT;
  const height = Math.max(
    MIN_BLOCK_HEIGHT,
    slotSpanFrac * ROW_HEIGHT - BLOCK_BOTTOM_GAP,
  );
  const left = TIME_GUTTER_WIDTH + colIndex * colWidth + 2;
  const width = colSpan * colWidth - 4;

  const colors = programTypeColor(session.program_type);
  const isCancelled = session.status === "cancelled";
  const isCompleted = session.status === "completed";

  const tournamentBorder = colors.isTournament
    ? `inset 0 0 0 2px rgba(0,0,0,0.35)`
    : "";
  const baseShadow = "0 1px 2px rgba(0,0,0,0.06)";
  const boxShadow = [baseShadow, tournamentBorder].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={(e) =>
        onClick(session, e.currentTarget.getBoundingClientRect())
      }
      aria-label={`${session.program_name ?? "Сессия"} ${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`}
      className="absolute group text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent"
      style={{
        top,
        left,
        width,
        height,
        background: colors.block,
        color: colors.ink,
        boxShadow,
        borderRadius: 6,
        padding: "4px 8px 6px",
        opacity: isCancelled ? 0.55 : 1,
        backgroundImage: isCancelled
          ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)"
          : undefined,
      }}
    >
      <CoachDots chips={session.coach_chips} />

      <div className="flex items-start gap-1 mt-1">
        {colors.isTournament && (
          <TrophyIcon className="w-3 h-3 mt-[3px] flex-shrink-0 opacity-90" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold leading-tight truncate">
            {session.program_name ?? "Без программы"}
          </div>
          <div className="text-[10.5px] leading-tight opacity-90 truncate tabular-nums">
            {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
            {spanLabelMode === "courts" && (
              <CourtSpanLabel
                colIndex={colIndex}
                colSpan={colSpan}
                nonContiguousCourtIndices={nonContiguousCourtIndices}
              />
            )}
            {session.attendee_count > 0 && (
              <span className="ml-1.5 opacity-90">
                · {session.attendee_count} игр.
              </span>
            )}
          </div>
        </div>
        {isCompleted && (
          <span
            aria-hidden
            className="text-[10px] leading-none mt-[2px] opacity-90"
            title="Проведена"
          >
            ✓
          </span>
        )}
      </div>

      {session.notes && height >= 56 && (
        <div className="text-[10px] mt-1 opacity-85 line-clamp-1 italic">
          {session.notes}
        </div>
      )}
    </button>
  );
}

function CourtSpanLabel({
  colIndex,
  colSpan,
  nonContiguousCourtIndices,
}: {
  colIndex: number;
  colSpan: number;
  nonContiguousCourtIndices?: number[];
}) {
  if (nonContiguousCourtIndices && nonContiguousCourtIndices.length > 0) {
    return (
      <span className="ml-1.5 opacity-90">
        · {nonContiguousCourtIndices.map((i) => `К${i + 1}`).join(", ")}
      </span>
    );
  }
  if (colSpan > 1) {
    return (
      <span className="ml-1.5 opacity-90">
        · К{colIndex + 1}–К{colIndex + colSpan}
      </span>
    );
  }
  return null;
}

function CoachDots({ chips }: { chips: SessionCoachChip[] }) {
  if (chips.length === 0) return null;
  const visible = chips.slice(0, 5);
  const overflow = chips.length - visible.length;
  return (
    <div className="flex items-center gap-1 h-[6px]">
      {visible.map((c) => (
        <span
          key={c.id}
          aria-label={c.name}
          title={c.name}
          className="block w-[6px] h-[6px] rounded-full ring-1 ring-white/40"
          style={{ background: c.color }}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[8px] leading-none opacity-80 ml-0.5">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M6 3h12v2h2.5a1.5 1.5 0 0 1 1.5 1.5v2A4.5 4.5 0 0 1 17.5 13h-.7a6 6 0 0 1-3.8 4.8V19h3v2H8v-2h3v-1.2A6 6 0 0 1 7.2 13h-.7A4.5 4.5 0 0 1 2 8.5v-2A1.5 1.5 0 0 1 3.5 5H6V3zm0 4H3.5v1.5A2.5 2.5 0 0 0 6 11V7zm12 0v4a2.5 2.5 0 0 0 2.5-2.5V7H18z" />
    </svg>
  );
}
