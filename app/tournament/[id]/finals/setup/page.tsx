import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getLeagueSeason } from "@/lib/queries/league-seasons";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { listPlayers } from "@/lib/queries/players";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listCourtsByIds } from "@/lib/queries/courts";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import {
  computeQualification,
  allowedBracketSizesForIndividual,
  allowedBracketSizesForTeam,
  smallestPow2AtLeast,
} from "@/lib/finals-qualification";
import type { Match } from "@/lib/types";
import { SetupWizard } from "./SetupWizard";

export default async function FinalsSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();
  if (tournament.type !== "league_season") notFound();

  const league = await getLeagueSeason(id);
  if (!league) notFound();

  if (league.finals_status === "in_progress") redirect(`/tournament/${id}/finals`);
  if (league.finals_status === "completed") {
    redirect(`/tournament/${id}/finals/results`);
  }

  const sessions = await listSessionsByTournament(id);
  const allCompleted =
    sessions.length > 0 && sessions.every((s) => s.status === "completed");

  const [registrations, players, courts] = await Promise.all([
    listRegistrations(id),
    listPlayers(),
    tournament.court_ids.length > 0
      ? listCourtsByIds(tournament.court_ids)
      : Promise.resolve([]),
  ]);

  const sessionInputs = await Promise.all(
    sessions.map(async (s) => {
      const rounds = await listRoundsBySession(s.id);
      const matchLists = await Promise.all(
        rounds.map((r) => listMatchesByRound(r.id)),
      );
      return {
        session: s,
        matches: matchLists.flat() as Match[],
        registrations: registrations.map((r) => ({
          player_id: r.player_id,
          partner_id: r.partner_id,
        })),
      };
    }),
  );

  const leaderboard = computeSeasonLeaderboard(
    tournament,
    sessionInputs,
    players,
    league.points_table,
    league.qualification_spots,
  );

  const qualification = computeQualification({
    format: tournament.format,
    leaderboard,
    registrations: registrations.map((r) => ({
      player_id: r.player_id,
      partner_id: r.partner_id,
    })),
    players,
  });

  const header = (
    <Link href={`/tournament/${id}`}>
      <Button variant="secondary" size="md">
        К лиге
      </Button>
    </Link>
  );

  if (!allCompleted) {
    return (
      <PageShell
        title={`Финалы · ${tournament.name}`}
        action={header}
      >
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">Сессии ещё не завершены</h2>
          <p className="text-sm text-muted">
            Завершите все сессии лиги, прежде чем создавать финальную сетку.
          </p>
          <div>
            <Link href={`/tournament/${id}`}>
              <Button size="sm" variant="secondary">
                Назад к лиге
              </Button>
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  const allowedSizes =
    qualification.kind === "team"
      ? allowedBracketSizesForTeam(qualification.pairs.length)
      : allowedBracketSizesForIndividual(qualification.individuals.length);

  if (allowedSizes.length === 0) {
    return (
      <PageShell title={`Финалы · ${tournament.name}`} action={header}>
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">Недостаточно участников</h2>
          <p className="text-sm text-muted">
            Для сетки нужно минимум{" "}
            {qualification.kind === "team" ? "1 пара" : "4 квалифицированных игрока"}
            .
          </p>
        </Card>
      </PageShell>
    );
  }

  const defaultBracketSize =
    qualification.kind === "team"
      ? Math.min(
          32,
          smallestPow2AtLeast(
            Math.min(qualification.pairs.length, league.qualification_spots),
          ),
        )
      : Math.min(
          32,
          smallestPow2AtLeast(
            Math.min(
              Math.floor(qualification.individuals.length / 2),
              Math.floor(league.qualification_spots / 2),
            ),
          ),
        );
  const safeDefault = allowedSizes.includes(defaultBracketSize)
    ? defaultBracketSize
    : allowedSizes[allowedSizes.length - 1];

  return (
    <PageShell title={`Финалы · ${tournament.name}`} action={header}>
      <SetupWizard
        tournamentId={id}
        leagueFinalsDate={league.finals_date}
        tournamentStartTime={tournament.start_time}
        qualification={qualification}
        playerNameById={Object.fromEntries(players.map((p) => [p.id, p.name]))}
        courts={courts}
        tournamentCourtIds={tournament.court_ids}
        allowedBracketSizes={allowedSizes}
        defaultBracketSize={safeDefault}
      />
    </PageShell>
  );
}
