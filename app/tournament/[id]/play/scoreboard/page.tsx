import { notFound } from "next/navigation";
import { getTournament } from "@/lib/queries/tournaments";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listRegistrations } from "@/lib/queries/registrations";
import { totalRoundsFor } from "@/lib/total-rounds";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import type { Match } from "@/lib/types";
import { Scoreboard } from "./Scoreboard";

export default async function ScoreboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const sessions = await listSessionsByTournament(id);
  const activeSession =
    sessions.find((s) => s.status === "in_progress") ??
    (tournament.type === "one_day"
      ? (sessions[sessions.length - 1] ?? null)
      : null);

  if (!activeSession) {
    return (
      <div className="min-h-dvh bg-black text-white flex items-center justify-center p-10 text-center">
        <div className="flex flex-col gap-3">
          <div className="text-3xl font-semibold">{tournament.name}</div>
          <div className="text-lg text-white/60">
            Сессия ещё не запущена
          </div>
        </div>
      </div>
    );
  }

  const rounds = await listRoundsBySession(activeSession.id);
  const matchLists = await Promise.all(
    rounds.map((r) => listMatchesByRound(r.id)),
  );
  const matches: Match[] = matchLists.flat();

  const [players, registrations] = await Promise.all([
    listPlayers(),
    listRegistrations(id),
  ]);

  const sessionPlayerIds = new Set<string>();
  for (const m of matches) {
    for (const pid of [
      m.team1_player1_id,
      m.team1_player2_id,
      m.team2_player1_id,
      m.team2_player2_id,
    ]) {
      if (pid) sessionPlayerIds.add(pid);
    }
  }
  const sessionPlayerCount =
    sessionPlayerIds.size > 0 ? sessionPlayerIds.size : registrations.length;
  const totalRounds = totalRoundsFor(tournament.format, sessionPlayerCount);

  const isTeamFormat =
    tournament.format === "team_americano" ||
    tournament.format === "team_mexicano";
  const pairs = isTeamFormat
    ? pairsFromRegistrations(
        registrations.filter((r) => sessionPlayerIds.has(r.player_id)),
      )
    : undefined;

  return (
    <Scoreboard
      tournament={tournament}
      initialRounds={rounds}
      initialMatches={matches}
      players={players}
      totalRounds={totalRounds}
      pairs={pairs}
    />
  );
}
