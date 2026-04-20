"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
  sortStrategyForFormat,
} from "@/lib/leaderboard";
import type { Pair } from "@/lib/algorithms/teamAmericano";
import type { Match, Player, Round, Tournament } from "@/lib/types";

export function Scoreboard({
  tournament,
  initialRounds,
  initialMatches,
  players,
  totalRounds,
  pairs,
}: {
  tournament: Tournament;
  initialRounds: Round[];
  initialMatches: Match[];
  players: Player[];
  totalRounds: number;
  pairs?: ReadonlyArray<Pair>;
}) {
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [prevInitialRounds, setPrevInitialRounds] = useState(initialRounds);
  const [prevInitialMatches, setPrevInitialMatches] = useState(initialMatches);
  if (initialRounds !== prevInitialRounds) {
    setPrevInitialRounds(initialRounds);
    setRounds(initialRounds);
  }
  if (initialMatches !== prevInitialMatches) {
    setPrevInitialMatches(initialMatches);
    setMatches(initialMatches);
  }

  const roundIds = useMemo(() => new Set(rounds.map((r) => r.id)), [rounds]);
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`scoreboard:${tournament.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const row = payload.new as Match;
          if (!matchIds.has(row.id)) return;
          setMatches((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rounds" },
        (payload) => {
          const row = payload.new as Round;
          if (!roundIds.has(row.id)) return;
          setRounds((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament.id, matchIds, roundIds]);

  const sortedRounds = useMemo(
    () => [...rounds].sort((a, b) => a.round_number - b.round_number),
    [rounds],
  );
  const currentRound =
    sortedRounds.find((r) => r.status === "in_progress") ??
    sortedRounds[sortedRounds.length - 1] ??
    null;
  const effectiveTotal = Math.max(totalRounds, sortedRounds.length);
  const completedRounds = sortedRounds.filter(
    (r) => r.status === "completed",
  ).length;

  const strategy = sortStrategyForFormat(tournament.format);
  const isTeamFormat = pairs && pairs.length > 0;
  const completedMatches = matches.filter((m) => m.status === "completed");

  const pairRows = useMemo(
    () =>
      isTeamFormat
        ? computePairLeaderboard(
            completedMatches,
            players,
            pairs,
            strategy,
          )
        : [],
    [isTeamFormat, completedMatches, players, pairs, strategy],
  );
  const playerRows = useMemo(
    () =>
      isTeamFormat
        ? []
        : computeLiveLeaderboard(completedMatches, players, strategy),
    [isTeamFormat, completedMatches, players, strategy],
  );

  const showWins = strategy === "wins";
  const rowsLength = isTeamFormat ? pairRows.length : playerRows.length;

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col relative">
      <Link
        href={`/tournament/${tournament.id}/play`}
        aria-label="Закрыть табло"
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xl leading-none"
      >
        ×
      </Link>
      <header className="flex items-center justify-between gap-6 px-10 py-6 border-b border-white/10">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-white/60 uppercase tracking-[0.2em] text-xs">
            Kosmo
          </div>
          <div className="text-3xl lg:text-5xl font-semibold truncate">
            {tournament.name}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-white/60 uppercase tracking-[0.2em] text-xs">
            Раунд
          </div>
          <div className="text-3xl lg:text-5xl font-bold tabular-nums">
            {currentRound?.round_number ?? completedRounds}
            <span className="text-white/40 text-2xl lg:text-3xl font-normal">
              {" "}
              / {effectiveTotal}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-10 py-8">
        {rowsLength === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50 text-2xl">
            Счёт появится после первого матча
          </div>
        ) : (
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="text-white/40 text-xs lg:text-sm uppercase tracking-widest">
                <th className="py-3 pr-6 w-16">#</th>
                <th className="py-3 pr-6">Игрок</th>
                <th className="py-3 pr-6 w-24 text-right">
                  {showWins ? "Поб." : "Матч."}
                </th>
                <th className="py-3 pr-6 w-28 text-right">+/−</th>
                <th className="py-3 w-32 text-right">Очки</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isTeamFormat
                ? pairRows.map((r, idx) => (
                    <ScoreRow
                      key={r.pairKey}
                      idx={idx}
                      name={r.displayName}
                      secondary={showWins ? r.wins : r.matchesPlayed}
                      plusMinus={r.plusMinus}
                      primary={showWins ? r.wins : r.points}
                    />
                  ))
                : playerRows.map((r, idx) => (
                    <ScoreRow
                      key={r.playerId}
                      idx={idx}
                      name={r.playerName}
                      secondary={showWins ? r.wins : r.matchesPlayed}
                      plusMinus={r.plusMinus}
                      primary={showWins ? r.wins : r.points}
                    />
                  ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

function ScoreRow({
  idx,
  name,
  secondary,
  plusMinus,
  primary,
}: {
  idx: number;
  name: string;
  secondary: number;
  plusMinus: number;
  primary: number;
}) {
  const isFirst = idx === 0;
  const rankTone = isFirst
    ? "text-accent"
    : idx === 1
      ? "text-white"
      : idx === 2
        ? "text-white/80"
        : "text-white/50";
  const rankSize = isFirst
    ? "text-[4rem] leading-none font-extrabold"
    : "text-[2.5rem] leading-none font-bold";
  const plusMinusTone =
    plusMinus > 0
      ? "text-[var(--color-success)]"
      : plusMinus < 0
        ? "text-[var(--color-danger)]"
        : "text-white/50";
  return (
    <tr className="align-middle">
      <td className={`py-4 pr-6 tabular-nums ${rankTone} ${rankSize}`}>
        {idx + 1}
      </td>
      <td className="py-4 pr-6 text-2xl lg:text-4xl font-medium truncate">
        {name}
      </td>
      <td className="py-4 pr-6 text-right text-xl lg:text-2xl text-white/70">
        {secondary}
      </td>
      <td
        className={`py-4 pr-6 text-right text-xl lg:text-2xl ${plusMinusTone}`}
      >
        {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
      </td>
      <td className="py-4 text-right text-3xl lg:text-5xl font-bold">
        {primary}
      </td>
    </tr>
  );
}
