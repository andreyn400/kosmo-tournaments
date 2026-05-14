"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDate } from "@/lib/i18n/format";
import {
  EVENT_KIND_LABEL_KEY,
  SESSION_STATUS_LABEL_KEY,
  TOURNAMENT_TYPE_KEY,
} from "@/lib/i18n/calendar-keys";
import {
  TOURNAMENT_FORMAT_KEY,
  TOURNAMENT_STATUS_KEY,
} from "@/lib/i18n/tournament-keys";
import { formatTimeRange } from "@/lib/calendar-layout";
import type { CalendarEvent } from "@/lib/queries/calendar";
import {
  eventBlockStyle,
  eventDetailLines,
  eventLinks,
  eventTitle,
} from "@/lib/calendar-events";
import type { Court, TournamentStatus } from "@/lib/types";

function statusTone(
  status: TournamentStatus,
):
  | "status-draft"
  | "status-registration"
  | "status-progress"
  | "status-completed" {
  if (status === "draft") return "status-draft";
  if (status === "registration_open") return "status-registration";
  if (status === "in_progress") return "status-progress";
  return "status-completed";
}

function courtListLabel(courtIds: string[], courts: Court[]): string | null {
  if (courtIds.length === 0) return null;
  const numbers: number[] = [];
  for (const id of courtIds) {
    const c = courts.find((x) => x.id === id);
    if (c) numbers.push(c.number);
  }
  if (numbers.length === 0) return null;
  numbers.sort((a, b) => a - b);
  return `№${numbers.join(", №")}`;
}

export function EventPopover({
  event,
  courts,
  onClose,
}: {
  event: CalendarEvent | null;
  courts: Court[];
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (event) {
      if (!d.open) d.showModal();
    } else {
      if (d.open) d.close();
    }
  }, [event]);

  const when = event
    ? event.startTime
      ? `${formatDate(event.date, lang)} · ${formatTimeRange(event.startTime, event.durationHours)}`
      : formatDate(event.date, lang)
    : "";

  const courtLabel = event ? courtListLabel(event.courtIds, courts) : null;
  const title = event ? eventTitle(event, t) : "";
  const detailLines = event ? eventDetailLines(event) : [];
  const links = event ? eventLinks(event) : [];
  const blockStyle = event ? eventBlockStyle(event) : null;
  const kindChipColor = event
    ? blockStyle?.useStatusStyle
      ? "var(--color-accent)"
      : blockStyle?.background
    : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto rounded-[var(--radius-card)] border border-border bg-surface p-0 w-[min(92vw,440px)] backdrop:bg-black/40"
    >
      {event && (
        <div
          className="flex flex-col gap-4 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: kindChipColor ?? "var(--color-accent)" }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {t(EVENT_KIND_LABEL_KEY[event.kind])}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-black leading-snug">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t("event.popover.close")}
              className="shrink-0 -mr-1 -mt-1 h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius-button)] text-muted hover:text-black hover:bg-subtle"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="text-sm text-secondary">{when}</div>

          {(event.kind === "tournament" || event.kind === "league_session") && (
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="format">{t(TOURNAMENT_FORMAT_KEY[event.format])}</Badge>
              <Badge tone={statusTone(event.tournamentStatus)}>
                {t(TOURNAMENT_STATUS_KEY[event.tournamentStatus])}
              </Badge>
              <Badge tone="neutral">
                {t(TOURNAMENT_TYPE_KEY[event.tournamentType])}
              </Badge>
            </div>
          )}

          <dl className="flex flex-col gap-2 text-sm">
            {courtLabel && (
              <div className="flex gap-2">
                <dt className="text-muted shrink-0">
                  {t("event.popover.courts_label")}
                </dt>
                <dd className="text-secondary">{courtLabel}</dd>
              </div>
            )}
            {event.kind === "league_session" && (
              <div className="flex gap-2">
                <dt className="text-muted shrink-0">
                  {t("event.popover.session_label")}
                </dt>
                <dd className="text-secondary">
                  №{event.sessionNumber}
                  {event.sessionStatus
                    ? ` · ${
                        SESSION_STATUS_LABEL_KEY[event.sessionStatus]
                          ? t(SESSION_STATUS_LABEL_KEY[event.sessionStatus])
                          : event.sessionStatus
                      }`
                    : ""}
                </dd>
              </div>
            )}
            {detailLines.map((line, i) => {
              const text = line.key ? t(line.key, line.vars) : (line.text ?? "");
              return (
                <div key={i} className="flex gap-2">
                  <dd className="text-secondary">{text}</dd>
                </div>
              );
            })}
          </dl>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => dialogRef.current?.close()}
            >
              {t("event.popover.close")}
            </Button>
            {links.map((link) =>
              link.primary ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-[var(--radius-button)] bg-accent text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)]"
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-[var(--radius-button)] border border-border bg-surface text-sm font-semibold text-black hover:bg-subtle"
                >
                  {t(link.labelKey)}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
