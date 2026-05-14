"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { TOURNAMENT_FORMAT_KEY } from "@/lib/i18n/tournament-keys";
import { DIVISION_CATEGORY_KEY } from "@/lib/i18n/scoring-keys";
import type { TranslationKey } from "@/lib/i18n";
import type { DisplayEvent, DisplayEventStatus } from "@/lib/queries/display";
import { UpcomingBody } from "./UpcomingBody";
import { LiveBody } from "./LiveBody";
import { CompletedBody } from "./CompletedBody";

type StatusMeta = {
  labelKey: TranslationKey;
  stripe: string;
  badge: string;
};

const STATUS_META: Record<DisplayEventStatus, StatusMeta> = {
  upcoming: {
    labelKey: "display.status.upcoming",
    stripe: "bg-accent",
    badge: "bg-warning-soft text-warning border border-warning/30",
  },
  in_progress: {
    labelKey: "display.status.in_progress",
    stripe: "bg-[var(--color-success)]",
    badge:
      "bg-success-soft text-[var(--color-success)] border border-[var(--color-success)]/30",
  },
  completed: {
    labelKey: "display.status.completed",
    stripe: "bg-border-strong",
    badge: "bg-subtle text-muted border border-border",
  },
};

type EventCardProps = {
  event: DisplayEvent;
};

export function EventCard({ event }: EventCardProps) {
  const { t } = useTranslation();
  const meta = STATUS_META[event.status];
  const muted = event.status === "completed";
  const courtPrefix = t("tournament.card.court_short_prefix");

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl bg-surface border border-border pl-5",
        muted ? "opacity-75" : "",
      ].join(" ")}
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-[5px] ${meta.stripe}`}
      />

      <div className="p-6 flex flex-col gap-5">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <h2 className="text-[1.4rem] font-bold leading-tight text-black truncate">
              {event.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {event.category ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.7rem] font-semibold tracking-wider uppercase bg-accent-soft text-accent border border-accent/30">
                  {t(DIVISION_CATEGORY_KEY[event.category])}
                </span>
              ) : null}
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.7rem] font-semibold tracking-wider uppercase bg-subtle text-secondary border border-border">
                {t(TOURNAMENT_FORMAT_KEY[event.format])}
              </span>
              {event.startTime && (
                <span className="inline-flex items-center text-[1.1rem] font-bold text-accent tabular-nums">
                  {event.startTime.slice(0, 5)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {event.status === "in_progress" && <PulsingDot />}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wider ${meta.badge}`}
            >
              {t(meta.labelKey)}
            </span>
          </div>
        </header>

        {event.courtNumbers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.courtNumbers.map((n) => (
              <span
                key={n}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-bold tabular-nums bg-accent-soft text-accent"
              >
                {courtPrefix}
                {n}
              </span>
            ))}
          </div>
        )}

        {event.status === "upcoming" && <UpcomingBody event={event} />}
        {event.status === "in_progress" && <LiveBody event={event} />}
        {event.status === "completed" && <CompletedBody event={event} />}
      </div>
    </article>
  );
}

function PulsingDot() {
  return (
    <span className="relative inline-flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-70 animate-ping" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-success)]" />
    </span>
  );
}
