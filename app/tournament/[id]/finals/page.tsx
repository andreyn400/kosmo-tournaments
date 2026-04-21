import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getLeagueSeason } from "@/lib/queries/league-seasons";
import { listBracketMatches } from "@/lib/queries/bracket-matches";
import { listPlayers } from "@/lib/queries/players";
import { listCourtsByIds } from "@/lib/queries/courts";
import { formatDateRu } from "@/lib/format-date";
import { SCORING_SYSTEM_LABEL_RU } from "@/lib/scoring-systems";
import { Bracket } from "./Bracket";

export default async function FinalsPage({
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

  if (league.finals_status === "not_created") {
    redirect(`/tournament/${id}/finals/setup`);
  }
  if (league.finals_status === "completed") {
    redirect(`/tournament/${id}/finals/results`);
  }

  const courtIdsUsed = Array.from(
    new Set(tournament.court_ids),
  );
  const [matches, players, courts] = await Promise.all([
    listBracketMatches(league.id),
    listPlayers(),
    courtIdsUsed.length > 0 ? listCourtsByIds(courtIdsUsed) : Promise.resolve([]),
  ]);
  const playerNameById = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const courtLabelById = Object.fromEntries(
    courts.map((c) => [c.id, String(c.number)]),
  );

  const scoringSystem = league.finals_scoring_system ?? "sets_best3";

  const header = (
    <Link href={`/tournament/${id}`}>
      <Button variant="secondary" size="md">
        К лиге
      </Button>
    </Link>
  );

  return (
    <PageShell title={`Финалы · ${tournament.name}`} action={header}>
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <InfoItem
              label="Система счёта"
              value={SCORING_SYSTEM_LABEL_RU[scoringSystem]}
            />
            <InfoItem
              label="Размер сетки"
              value={
                league.finals_bracket_size
                  ? `${league.finals_bracket_size} пар`
                  : "—"
              }
            />
            <InfoItem
              label="Дата финала"
              value={league.finals_date ? formatDateRu(league.finals_date) : "—"}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">Сетка финала</h2>
          <Bracket
            tournamentId={id}
            matches={matches}
            scoringSystem={scoringSystem}
            playerNameById={playerNameById}
            courtLabelById={courtLabelById}
          />
        </Card>
      </div>
    </PageShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="text-black">{value}</span>
    </div>
  );
}
