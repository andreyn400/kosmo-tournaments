"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
  sortStrategyForFormat,
  type PairLeaderboardRow,
  type LeaderboardRow,
} from "@/lib/leaderboard";
import type { Pair } from "@/lib/algorithms/teamAmericano";
import { scoringGroup } from "@/lib/scoring-systems";
import type {
  Match,
  Player,
  ScoringSystem,
  TournamentFormat,
} from "@/lib/types";

export function LeaderboardPanel({
  matches,
  players,
  format,
  scoringSystem,
  pairs,
}: {
  matches: Match[];
  players: Player[];
  format: TournamentFormat;
  scoringSystem: ScoringSystem;
  pairs?: ReadonlyArray<Pair>;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const strategy = sortStrategyForFormat(format);
  const isTeamFormat = pairs && pairs.length > 0;
  const isSets = scoringGroup(scoringSystem) === "sets";
  const pointsLabel = isSets
    ? t("leaderboard.sets_label")
    : t("leaderboard.points_or_sets");

  const pairRows = useMemo<PairLeaderboardRow[]>(
    () =>
      isTeamFormat
        ? computePairLeaderboard(
            matches,
            players,
            pairs,
            strategy,
            scoringSystem,
          )
        : [],
    [isTeamFormat, matches, players, pairs, strategy, scoringSystem],
  );
  const playerRows = useMemo<LeaderboardRow[]>(
    () =>
      isTeamFormat
        ? []
        : computeLiveLeaderboard(matches, players, strategy, scoringSystem),
    [isTeamFormat, matches, players, strategy, scoringSystem],
  );

  const hasRows = isTeamFormat ? pairRows.length > 0 : playerRows.length > 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-black">{t("leaderboard.title")}</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          className="md:hidden"
        >
          {collapsed ? t("match.show") : t("match.hide")}
        </Button>
      </div>

      <div className={collapsed ? "hidden md:block" : "block"}>
        {!hasRows ? (
          <p className="text-sm text-muted">{t("leaderboard.empty")}</p>
        ) : (
          <div className="border border-border rounded-[var(--radius-button)] overflow-hidden">
            <div className="bg-subtle px-3 py-2 grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center text-[10px] font-semibold text-muted uppercase tracking-[0.08em]">
              <span className="w-5 text-right">#</span>
              <span>{t("leaderboard.col.player")}</span>
              <span className="w-8 text-right">
                {t("leaderboard.col.matches")}
              </span>
              <span className="hidden sm:inline w-12 text-right">+/−</span>
              <span className="w-10 text-right">{pointsLabel}</span>
            </div>
            <ol className="flex flex-col divide-y divide-border bg-surface">
              {isTeamFormat
                ? pairRows.map((r, idx) => (
                    <Row
                      key={r.pairKey}
                      idx={idx}
                      name={r.displayName}
                      primary={strategy === "wins" ? r.wins : r.matchesPlayed}
                      plusMinus={r.plusMinus}
                      points={r.points}
                      wrap
                    />
                  ))
                : playerRows.map((r, idx) => (
                    <Row
                      key={r.playerId}
                      idx={idx}
                      name={r.playerName}
                      primary={strategy === "wins" ? r.wins : r.matchesPlayed}
                      plusMinus={r.plusMinus}
                      points={r.points}
                    />
                  ))}
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({
  idx,
  name,
  primary,
  plusMinus,
  points,
  wrap,
}: {
  idx: number;
  name: string;
  primary: number;
  plusMinus: number;
  points: number;
  wrap?: boolean;
}) {
  const rankClass =
    idx === 0
      ? "font-extrabold text-black"
      : idx <= 2
        ? "font-semibold text-secondary"
        : "font-normal text-muted";
  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-3 py-2.5 text-sm hover:bg-hover transition-colors">
      <span className={`w-5 text-right tabular-nums ${rankClass}`}>
        {idx + 1}
      </span>
      <span
        className={`text-black font-medium min-w-0 ${wrap ? "leading-tight" : "truncate"}`}
      >
        {name}
      </span>
      <span className="w-8 text-right text-xs text-muted tabular-nums">
        {primary}
      </span>
      <span
        className={`hidden sm:inline w-12 text-right text-xs tabular-nums ${
          plusMinus > 0
            ? "text-[var(--color-success)]"
            : plusMinus < 0
              ? "text-[var(--color-danger)]"
              : "text-muted"
        }`}
      >
        {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
      </span>
      <span className="w-10 text-right text-base font-bold text-black tabular-nums">
        {points}
      </span>
    </li>
  );
}
