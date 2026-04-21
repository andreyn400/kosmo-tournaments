import { notFound } from "next/navigation";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision } from "@/lib/queries/divisions";
import { listRoundsByDivision } from "@/lib/queries/rounds";
import { listMatchesByDivision } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { totalRoundsFor } from "@/lib/total-rounds";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import { Scoreboard } from "../../../../play/scoreboard/Scoreboard";

export default async function DivisionScoreboardPage({
  params,
}: {
  params: Promise<{ id: string; divisionId: string }>;
}) {
  const { id, divisionId } = await params;
  const [tournament, division] = await Promise.all([
    getTournament(id),
    getDivision(divisionId),
  ]);
  if (!tournament || !division || division.tournament_id !== id) notFound();

  if (division.status !== "in_progress" && division.status !== "completed") {
    return (
      <div className="min-h-dvh bg-black text-white flex items-center justify-center p-10 text-center">
        <div className="flex flex-col gap-3">
          <div className="text-3xl font-semibold">
            {tournament.name} · {division.name}
          </div>
          <div className="text-lg text-white/60">Дивизион ещё не запущен</div>
        </div>
      </div>
    );
  }

  const [rounds, matches, players, registrations] = await Promise.all([
    listRoundsByDivision(divisionId),
    listMatchesByDivision(divisionId),
    listPlayers(),
    listRegistrationsByDivision(divisionId),
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
  const totalRounds = totalRoundsFor(division.format, sessionPlayerCount);

  const isTeamFormat =
    division.format === "team_americano" ||
    division.format === "team_mexicano";
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
      divisionId={division.id}
      divisionName={division.name}
      divisionFormat={division.format}
    />
  );
}
