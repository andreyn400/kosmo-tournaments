"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Court,
  Match,
  Player,
  Round,
  Tournament,
  TournamentSession,
} from "@/lib/types";
import type { Pair } from "@/lib/algorithms/teamAmericano";
import { RoundPanel } from "./RoundPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import {
  ConnectionIndicator,
  type ConnectionState,
} from "./ConnectionIndicator";

export function LivePlayBoard({
  tournament,
  session,
  initialRounds,
  initialMatches,
  players,
  courts,
  totalRounds,
  pairs,
  divisionId,
  divisionFormat,
  divisionScoringSystem,
}: {
  tournament: Tournament;
  session: TournamentSession;
  initialRounds: Round[];
  initialMatches: Match[];
  players: Player[];
  courts: Court[];
  totalRounds: number;
  pairs?: ReadonlyArray<Pair>;
  divisionId?: string | null;
  divisionFormat?: Tournament["format"];
  divisionScoringSystem?: Tournament["scoring_system"];
}) {
  const format = divisionFormat ?? tournament.format;
  const scoringSystem = divisionScoringSystem ?? tournament.scoring_system;
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
  const [connection, setConnection] =
    useState<ConnectionState>("connecting");

  const roundIds = useMemo(() => new Set(rounds.map((r) => r.id)), [rounds]);
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tournament:${tournament.id}`)
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("connected");
        else if (status === "CHANNEL_ERROR" || status === "CLOSED")
          setConnection("disconnected");
        else if (status === "TIMED_OUT") setConnection("disconnected");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament.id, matchIds, roundIds]);

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );
  const courtById = useMemo(
    () => new Map(courts.map((c) => [c.id, c])),
    [courts],
  );

  const sortedRounds = useMemo(
    () => [...rounds].sort((a, b) => a.round_number - b.round_number),
    [rounds],
  );
  const effectiveTotal = Math.max(totalRounds, sortedRounds.length);
  const currentRound =
    sortedRounds.find((r) => r.status === "in_progress") ?? null;
  const allMaterializedComplete =
    sortedRounds.length > 0 &&
    sortedRounds.every((r) => r.status === "completed");
  const allRoundsComplete =
    allMaterializedComplete && sortedRounds.length >= effectiveTotal;
  const roundNumberIsLast = (roundNumber: number) =>
    roundNumber === effectiveTotal;

  const completedMatches = matches.filter((m) => m.status === "completed");

  const matchesByRound = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const arr = map.get(m.round_id) ?? [];
      arr.push(m);
      map.set(m.round_id, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          (a.court_number ?? 0) - (b.court_number ?? 0),
      );
    }
    return map;
  }, [matches]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted uppercase tracking-wider">
            {effectiveTotal > 0
              ? `Раунд ${currentRound?.round_number ?? sortedRounds.length} из ${effectiveTotal}`
              : "Нет раундов"}
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: effectiveTotal }, (_, i) => {
              const r = sortedRounds.find((x) => x.round_number === i + 1);
              const status = r?.status ?? "pending";
              return (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    status === "completed"
                      ? "bg-accent"
                      : status === "in_progress"
                        ? "bg-accent/40 ring-2 ring-accent/20"
                        : "bg-border"
                  }`}
                  title={`Раунд ${i + 1} · ${status}`}
                />
              );
            })}
          </div>
        </div>
        <ConnectionIndicator state={connection} />
      </header>

      <div className="grid md:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {sortedRounds.map((r) => (
            <RoundPanel
              key={r.id}
              tournamentId={tournament.id}
              tournamentType={tournament.type}
              sessionId={session.id}
              divisionId={divisionId ?? null}
              round={r}
              matches={matchesByRound.get(r.id) ?? []}
              playerById={playerById}
              courtById={courtById}
              scoringSystem={scoringSystem}
              isCurrent={r.id === currentRound?.id}
              isLast={roundNumberIsLast(r.round_number)}
              allRoundsComplete={allRoundsComplete}
            />
          ))}
        </div>

        <aside className="md:sticky md:top-20">
          <LeaderboardPanel
            matches={completedMatches}
            players={players}
            format={format}
            scoringSystem={scoringSystem}
            pairs={pairs}
          />
        </aside>
      </div>
    </div>
  );
}
