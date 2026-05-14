import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision } from "@/lib/queries/divisions";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRoundsByDivision } from "@/lib/queries/rounds";
import { listMatchesByDivision } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listCourtsByIds } from "@/lib/queries/courts";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { totalRoundsFor } from "@/lib/total-rounds";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import { getServerDict } from "@/lib/i18n/server";
import { LivePlayBoard } from "../../../play/LivePlayBoard";

export default async function DivisionPlayPage({
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

  if (division.status === "completed") {
    redirect(`/tournament/${id}/division/${divisionId}`);
  }

  const dict = await getServerDict();
  const sessions = await listSessionsByTournament(id);
  const activeSession =
    sessions.find((s) => s.status === "in_progress") ??
    sessions[sessions.length - 1] ??
    null;

  const backHref = `/tournament/${id}/division/${divisionId}`;
  const title = `${tournament.name} · ${division.name}`;

  if (!activeSession || division.status !== "in_progress") {
    return (
      <PageShell
        title={title}
        action={
          <Link href={backHref}>
            <Button variant="secondary" size="md">
              {dict["play.back_to_division"]}
            </Button>
          </Link>
        }
      >
        <Card>
          <p className="text-sm text-muted">
            {dict["play.division_not_started_copy"]}
          </p>
        </Card>
      </PageShell>
    );
  }

  const rounds = await listRoundsByDivision(divisionId);
  const matches = await listMatchesByDivision(divisionId);
  const [players, registrations, courts] = await Promise.all([
    listPlayers(),
    listRegistrationsByDivision(divisionId),
    division.court_ids.length > 0
      ? listCourtsByIds(division.court_ids)
      : Promise.resolve([]),
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
    <PageShell
      title={title}
      action={
        <div className="flex items-center gap-1.5">
          <Link href={`${backHref}/play/scoreboard`} target="_blank">
            <Button variant="ghost" size="md">
              {dict["play.scoreboard_cta"]}
            </Button>
          </Link>
          <Link href={backHref}>
            <Button variant="secondary" size="md">
              <span className="hidden sm:inline">
                {dict["play.back_to_division"]}
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
          href={backHref}
          className="text-sm text-muted hover:text-black inline-flex items-center gap-1.5 self-start"
        >
          <span aria-hidden>←</span>{" "}
          {dict["play.back_to_division_with_name"].replace(
            "{name}",
            division.name,
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
          divisionId={division.id}
          divisionFormat={division.format}
          divisionScoringSystem={division.scoring_system}
        />
      </div>
    </PageShell>
  );
}
