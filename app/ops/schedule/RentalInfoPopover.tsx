"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  formatDate,
  getWeekdayLongLabels,
} from "@/lib/i18n/format";
import type { Court, RentalBlockForGrid } from "@/lib/types";

const POPOVER_WIDTH = 340;
const POPOVER_GAP = 8;
const VIEWPORT_MARGIN = 12;

interface RentalInfoPopoverProps {
  block: RentalBlockForGrid;
  anchor: DOMRect;
  courts: Court[];
  onClose: () => void;
}

export function RentalInfoPopover({
  block,
  anchor,
  courts,
  onClose,
}: RentalInfoPopoverProps) {
  const { t, lang } = useTranslation();
  const dayLong = getWeekdayLongLabels(lang);
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const popover = ref.current;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const height = popover?.offsetHeight ?? 280;

    let left = anchor.right + POPOVER_GAP;
    if (left + POPOVER_WIDTH > vpW - VIEWPORT_MARGIN) {
      left = anchor.left - POPOVER_WIDTH - POPOVER_GAP;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    let top = anchor.top;
    if (top + height > vpH - VIEWPORT_MARGIN) {
      top = vpH - height - VIEWPORT_MARGIN;
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    setPosition({ top, left });
  }, [anchor]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    const tm = setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(tm);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const courtNames = block.court_ids
    .map((id) => courts.find((c) => c.id === id)?.name ?? "?")
    .join(", ");

  const instanceDate = new Date(block.date + "T00:00:00");
  const dow = (instanceDate.getDay() + 6) % 7;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t("schedule.rental_popover.aria", { name: block.client_name })}
      className="fixed z-50 bg-surface rounded-card border border-border shadow-xl flex flex-col"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width: POPOVER_WIDTH,
        opacity: position ? 1 : 0,
        transition: "opacity 80ms ease-out",
      }}
    >
      <header className="flex items-center gap-2 px-4 h-11 border-b border-border flex-shrink-0">
        <span
          className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "#0d9488", color: "#fff" }}
        >
          {t("schedule.rental.label")}
        </span>
        <h2 className="text-sm font-semibold text-black flex-1 truncate">
          {block.client_name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("event.popover.close")}
          className="w-7 h-7 inline-flex items-center justify-center rounded text-muted hover:bg-subtle hover:text-black transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </header>

      <div className="px-4 py-3 flex flex-col gap-3">
        <Field
          label={t("schedule.rental_popover.field.contract_no")}
          value={block.contract_number}
          mono
        />

        <div className="grid gap-3 grid-cols-2">
          <Field
            label={t("schedule.rental_popover.field.date")}
            value={formatDate(block.date, lang)}
          />
          <Field
            label={t("schedule.rental_popover.field.day_time")}
            value={
              <span>
                <span className="block text-[11px] text-secondary">
                  {dayLong[dow]}
                </span>
                <span className="tabular-nums">
                  {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
                </span>
              </span>
            }
          />
        </div>

        <Field
          label={t("schedule.rental_popover.field.courts")}
          value={courtNames || "—"}
        />

        {block.slot_notes && (
          <Field
            label={t("schedule.rental_popover.field.slot_notes")}
            value={block.slot_notes}
            multiline
          />
        )}
      </div>

      <footer className="border-t border-border px-4 py-2.5 flex-shrink-0">
        <Link
          href={`/ops/rentals/${block.contract_id}`}
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          {t("schedule.rental_popover.open_contract")}
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span
        className={[
          "text-sm text-black",
          mono ? "font-mono" : "",
          multiline ? "whitespace-pre-wrap" : "truncate",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value || <span className="text-fade">—</span>}
      </span>
    </div>
  );
}
