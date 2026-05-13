"use client";

import type { RentalBlockForGrid } from "@/lib/types";
import { minutesFromTime, OPS_OPEN_HOUR } from "@/lib/ops-constants";
import {
  BLOCK_BOTTOM_GAP,
  HEADER_HEIGHT,
  MIN_BLOCK_HEIGHT,
  ROW_HEIGHT,
  TIME_GUTTER_WIDTH,
} from "./grid-constants";

interface RentalBlockProps {
  block: RentalBlockForGrid;
  /** 0-based column index where the block starts. */
  colIndex: number;
  /** Number of columns the block spans. Day-view multi-court uses > 1. */
  colSpan: number;
  /** Live column width (fluid in wide viewports, fixed in scroll mode). */
  colWidth: number;
  /** Day view shows the court span badge; week view suppresses it. */
  showCourtSpan: boolean;
  onClick: (block: RentalBlockForGrid, anchor: DOMRect) => void;
}

const TEAL_FILL = "#0d9488"; // teal-600
const TEAL_FILL_DARK = "#0f766e"; // teal-700 for the AРЕНДА tag bg

/**
 * Read-only recurring-rental block. Visually distinct from session blocks:
 * teal fill, white diagonal-stripe overlay for texture, prominent АРЕНДА
 * tag in the top-left, dashed bottom-edge accent. Click opens the read-only
 * rental info popover with a deep link to the contract.
 */
export function RentalBlock({
  block,
  colIndex,
  colSpan,
  colWidth,
  showCourtSpan,
  onClick,
}: RentalBlockProps) {
  const startMin = minutesFromTime(block.start_time);
  const endMin = minutesFromTime(block.end_time);
  const startSlotFrac = (startMin - OPS_OPEN_HOUR * 60) / 30;
  const slotSpanFrac = (endMin - startMin) / 30;

  const top = HEADER_HEIGHT + startSlotFrac * ROW_HEIGHT;
  const height = Math.max(
    MIN_BLOCK_HEIGHT,
    slotSpanFrac * ROW_HEIGHT - BLOCK_BOTTOM_GAP,
  );
  const left = TIME_GUTTER_WIDTH + colIndex * colWidth + 2;
  const width = colSpan * colWidth - 4;

  return (
    <button
      type="button"
      onClick={(e) =>
        onClick(block, e.currentTarget.getBoundingClientRect())
      }
      aria-label={`Аренда — ${block.client_name} ${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)}`}
      className="absolute text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent"
      style={{
        top,
        left,
        width,
        height,
        background: TEAL_FILL,
        color: "#ffffff",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.06), inset 0 0 0 1.5px rgba(255,255,255,0.55)",
        borderRadius: 6,
        padding: "4px 8px 6px",
        // Diagonal stripe texture that survives any block size.
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 14px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex items-center px-1.5 h-4 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{ background: TEAL_FILL_DARK, color: "#ffffff" }}
        >
          Аренда
        </span>
        {showCourtSpan && colSpan > 1 && (
          <span className="text-[10px] font-semibold opacity-95">
            К{colIndex + 1}–К{colIndex + colSpan}
          </span>
        )}
      </div>

      <div className="mt-1 text-[12px] font-semibold leading-tight truncate">
        {block.client_name}
      </div>
      <div className="text-[10.5px] leading-tight opacity-90 truncate tabular-nums">
        {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
        {block.contract_number && (
          <span className="ml-1.5 opacity-85">· {block.contract_number}</span>
        )}
      </div>
    </button>
  );
}
