import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listCourtsByIds } from "@/lib/queries/courts";
import { listRegistrations } from "@/lib/queries/registrations";
import { totalRoundsFor } from "@/lib/total-rounds";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import { getServerDict } from "@/lib/i18n/server";
import type { Match } from "@/lib/types";
import { LivePlayBoard } from "./LivePlayBoard";

export default async function LivePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  if (tournament.status === "completed") {
    redirect(`/tournament/${id}/results`);
  }

  const dict = await getServerDict();
  const sessions = await listSessionsByTournament(id);
  const activeSession =
    sessions.find((s) => s.status === "in_progress") ??
    (tournament.type === "one_day"
      ? (sessions[sessions.length - 1] ?? null)
      : null);

  if (!activeSession) {
    return (
      <PageShell
        title={tournament.name}
        action={
          <Link href={`/tournament/${id}`}>
            <Button variant="secondary" size="md">
              {dict["play.back_to_tournament"]}
            </Button>
          </Link>
        }
      >
        <Card>
          <p className="text-sm text-muted">
            {tournament.type === "league_season"
              ? dict["play.no_session_league"]
              : dict["play.no_session"]}
          </p>
        </Card>
      </PageShell>
    );
  }

  const rounds = await listRoundsBySession(activeSession.id);
  const matchLists = await Promise.all(
    rounds.map((r) => listMatchesByRound(r.id)),
  );
  const matches: Match[] = matchLists.flat();
  const [players, registrations, courts] = await Promise.all([
    listPlayers(),
    listRegistrations(id),
    listCourtsByIds(tournament.court_ids ?? []),
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
    <PageShell
      title={tournament.name}
      action={
        <div className="flex items-center gap-1.5">
          <Link href={`/tournament/${id}/play/scoreboard`} target="_blank">
            <Button variant="ghost" size="md">
              {dict["play.scoreboard_cta"]}
            </Button>
          </Link>
          <Link href={`/tournament/${id}`}>
            <Button variant="secondary" size="md">
              <span className="hidden sm:inline">
                {dict["play.back_to_tournament"]}
              </span>
              <span className="sm:hidden">
                {dict["play.back_to_tournament_short"]}
              </span>
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link
          href={`/tournament/${id}`}
          className="text-sm text-muted hover:text-black inline-flex items-center gap-1.5 self-start"
        >
          <span aria-hidden>←</span>{" "}
          {dict["play.back_to_tournament_with_name"].replace(
            "{name}",
            tournament.name,
          )}
        </Link>
        <LivePlayBoard
          tournament={tournament}
          session={activeSession}
          initialRounds={rounds}
          initialMatches={matches}
          players={players}
          courts={courts}
          totalRounds={totalRounds}
          pairs={pairs}
        />
      </div>
    </PageShell>
  );
}
