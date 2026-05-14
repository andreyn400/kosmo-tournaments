"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, OverflowPill } from "@/components/ui/Avatar";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDateRange, formatTime } from "@/lib/i18n/format";
import {
  TOURNAMENT_FORMAT_KEY,
  TOURNAMENT_STATUS_KEY,
} from "@/lib/i18n/tournament-keys";
import { statusTone } from "@/lib/status-tone";
import type { Court, Tournament } from "@/lib/types";
import { deleteTournamentListAction } from "@/app/delete-tournament-list-action";

const MAX_COURTS_SHOWN = 3;
const MAX_PLAYERS_SHOWN = 6;

type PlayerSummary = {
  id: string;
  name: string;
  photo_url: string | null;
};

export function TournamentCard({
  tournament,
  courts,
  players = [],
  divisionCount = 0,
}: {
  tournament: Tournament;
  courts: Court[];
  players?: PlayerSummary[];
  divisionCount?: number;
}) {
  const t = tournament;
  const { t: tr, tPlural, lang } = useTranslation();
  const [mode, setMode] = useState<"idle" | "confirming" | "deleted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const courtMap = useMemo(
    () => new Map(courts.map((c) => [c.id, c])),
    [courts],
  );
  const assignedCourts = useMemo(() => {
    const list: Court[] = [];
    for (const id of t.court_ids ?? []) {
      const c = courtMap.get(id);
      if (c) list.push(c);
    }
    list.sort((a, b) => a.number - b.number);
    return list;
  }, [t.court_ids, courtMap]);

  if (mode === "deleted") return null;

  const tone = statusTone(t.status);
  const levelRange =
    t.level_min && t.level_max
      ? t.level_min === t.level_max
        ? tr("tournament.card.level_one", { level: t.level_min })
        : tr("tournament.card.level_range", {
            min: t.level_min,
            max: t.level_max,
          })
      : tr("tournament.card.level_all");
  const dateRange = formatDateRange(t.date_start, t.date_end, lang);
  const startTimeStr = formatTime(t.start_time);
  const dateLine = startTimeStr ? `${dateRange} · ${startTimeStr}` : dateRange;

  const leftBorderClass =
    t.status === "in_progress"
      ? "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-accent before:rounded-l-[var(--radius-card)] relative"
      : t.status === "completed"
        ? "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--color-success)] before:rounded-l-[var(--radius-card)] relative"
        : "";

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const confirmDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteTournamentListAction(t.id);
      if (res?.error) {
        setError(res.error);
      } else {
        setMode("deleted");
      }
    });
  };

  const shownCourts = assignedCourts.slice(0, MAX_COURTS_SHOWN);
  const extraCourts = Math.max(0, assignedCourts.length - MAX_COURTS_SHOWN);
  const shownPlayers = players.slice(0, MAX_PLAYERS_SHOWN);
  const extraPlayers = Math.max(0, players.length - MAX_PLAYERS_SHOWN);
  const courtPrefix = tr("tournament.card.court_short_prefix");

  return (
    <Link
      href={`/tournament/${t.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-[var(--radius-card)]"
    >
      <Card
        interactive
        className={`flex flex-col gap-4 ${leftBorderClass}`.trim()}
      >
        {mode === "confirming" ? (
          <div
            className="flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-black">
              {tr("tournament.card.delete_confirm")
                .split("{name}")
                .map((chunk, i, arr) => (
                  <span key={i}>
                    {chunk}
                    {i < arr.length - 1 ? (
                      <span className="font-semibold">{t.name}</span>
                    ) : null}
                  </span>
                ))}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={(e) => {
                  stop(e);
                  confirmDelete();
                }}
              >
                {pending
                  ? tr("tournament.card.delete_pending")
                  : tr("tournament.card.confirm_yes")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={(e) => {
                  stop(e);
                  setMode("idle");
                  setError(null);
                }}
              >
                {tr("tournament.card.confirm_no")}
              </Button>
            </div>
            {error ? (
              <p role="alert" className="text-xs text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-black leading-snug min-w-0">
                {t.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge tone="format">{tr(TOURNAMENT_FORMAT_KEY[t.format])}</Badge>
                <button
                  type="button"
                  aria-label={tr("tournament.card.delete_aria")}
                  onClick={(e) => {
                    stop(e);
                    setMode("confirming");
                  }}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-button)] text-fade hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>{dateLine}</span>
              <span aria-hidden>·</span>
              <span>{levelRange}</span>
            </div>
            {players.length > 0 ? (
              <div className="flex items-center pl-2">
                {shownPlayers.map((p) => (
                  <div key={p.id} className="-ml-2">
                    <Avatar name={p.name} photoUrl={p.photo_url} size="xs" />
                  </div>
                ))}
                {extraPlayers > 0 ? (
                  <div className="-ml-2">
                    <OverflowPill count={extraPlayers} size="xs" />
                  </div>
                ) : null}
              </div>
            ) : null}
            {assignedCourts.length > 0 || divisionCount > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {divisionCount > 0 ? (
                  <span className="inline-flex items-center h-6 px-2 rounded-[var(--radius-button)] bg-accent-soft border border-accent/30 text-[11px] font-semibold text-accent uppercase tracking-[0.06em]">
                    {tPlural(divisionCount, {
                      one: "tournament.card.divisions_one",
                      few: "tournament.card.divisions_few",
                      many: "tournament.card.divisions_many",
                    })}
                  </span>
                ) : null}
                {shownCourts.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center h-6 px-2 rounded-[var(--radius-button)] bg-subtle border border-border text-[11px] font-semibold text-secondary tabular-nums"
                  >
                    {courtPrefix}
                    {c.number}
                  </span>
                ))}
                {extraCourts > 0 ? (
                  <span className="inline-flex items-center h-6 px-2 rounded-[var(--radius-button)] bg-subtle border border-border text-[11px] font-semibold text-muted tabular-nums">
                    +{extraCourts}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-1">
              <Badge tone={tone}>{tr(TOURNAMENT_STATUS_KEY[t.status])}</Badge>
              {t.max_players ? (
                <span className="text-sm text-muted">
                  {tPlural(t.max_players, {
                    one: "tournament.card.max_players_one",
                    few: "tournament.card.max_players_few",
                    many: "tournament.card.max_players_many",
                  })}
                </span>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </Link>
  );
}
