import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getLeagueSeason } from "@/lib/queries/league-seasons";
import { listBracketMatches } from "@/lib/queries/bracket-matches";
import { listPlayers } from "@/lib/queries/players";
import { listCourtsByIds } from "@/lib/queries/courts";
import { formatDateRu } from "@/lib/format-date";
import {
  SCORING_SYSTEM_LABEL_RU,
  scoringGroup,
  setsSummary,
  isSetsDetail,
  type SetsDetail,
} from "@/lib/scoring-systems";
import type { BracketMatch } from "@/lib/types";
import { Bracket } from "../Bracket";

export default async function FinalsResultsPage({
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
  if (league.finals_status === "in_progress") {
    redirect(`/tournament/${id}/finals`);
  }

  const [matches, players, courts] = await Promise.all([
    listBracketMatches(league.id),
    listPlayers(),
    tournament.court_ids.length > 0
      ? listCourtsByIds(tournament.court_ids)
      : Promise.resolve([]),
  ]);
  const playerNameById = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const courtLabelById = Object.fromEntries(
    courts.map((c) => [c.id, String(c.number)]),
  );

  const scoringSystem = league.finals_scoring_system ?? "sets_best3";

  const finalMatch = matches.find((m) => m.next_match_id === null) ?? null;
  const maxRound =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round_number)) : 0;
  const semifinals = matches.filter((m) => m.round_number === maxRound - 1);

  const championPair = buildPair(finalMatch, "winner", playerNameById);
  const runnerUpPair = buildPair(finalMatch, "loser", playerNameById);

  const thirdPlacePairs = semifinals
    .filter((m) => m.status === "completed" && m.winner_team)
    .map((m) => buildPair(m, "loser", playerNameById))
    .filter((p): p is PairView => p !== null);

  const finalSummary = finalMatch ? formatFinalSummary(finalMatch, scoringSystem) : null;

  const header = (
    <Link href={`/tournament/${id}`}>
      <Button variant="secondary" size="md">
        К лиге
      </Button>
    </Link>
  );

  return (
    <PageShell title={`Итоги финала · ${tournament.name}`} action={header}>
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Badge tone="status-completed">Финал завершён</Badge>
            {league.finals_date ? (
              <span className="text-sm text-muted">
                {formatDateRu(league.finals_date)}
              </span>
            ) : null}
          </div>
          {championPair ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.08em] text-muted">
                Чемпионы
              </span>
              <p className="text-xl font-bold text-black">
                {championPair.label}
              </p>
              {finalSummary ? (
                <p className="text-sm text-muted">Счёт финала: {finalSummary}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Не удалось определить чемпионов.
            </p>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {runnerUpPair ? (
            <Card className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.08em] text-muted">
                Финалисты
              </span>
              <p className="text-base font-semibold text-black">
                {runnerUpPair.label}
              </p>
            </Card>
          ) : null}

          {thirdPlacePairs.length > 0 ? (
            <Card className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.08em] text-muted">
                Полуфиналисты
              </span>
              <ul className="flex flex-col gap-0.5">
                {thirdPlacePairs.map((p, idx) => (
                  <li
                    key={`sf-${idx}`}
                    className="text-base font-semibold text-black"
                  >
                    {p.label}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-black">Сетка финала</h2>
            <span className="text-xs text-muted">
              {SCORING_SYSTEM_LABEL_RU[scoringSystem]}
            </span>
          </div>
          <Bracket
            tournamentId={id}
            matches={matches}
            scoringSystem={scoringSystem}
            playerNameById={playerNameById}
            courtLabelById={courtLabelById}
            readOnly
          />
        </Card>
      </div>
    </PageShell>
  );
}

interface PairView {
  player1_id: string;
  player2_id: string;
  label: string;
}

function buildPair(
  match: BracketMatch | null,
  which: "winner" | "loser",
  nameById: Record<string, string>,
): PairView | null {
  if (!match || !match.winner_team) return null;
  const takeTeam1 =
    which === "winner" ? match.winner_team === 1 : match.winner_team === 2;
  const p1 = takeTeam1 ? match.team1_player1_id : match.team2_player1_id;
  const p2 = takeTeam1 ? match.team1_player2_id : match.team2_player2_id;
  if (!p1 || !p2) return null;
  const label = `${nameById[p1] ?? "—"} / ${nameById[p2] ?? "—"}`;
  return { player1_id: p1, player2_id: p2, label };
}

function formatFinalSummary(
  match: BracketMatch,
  scoringSystem: string,
): string | null {
  if (match.team1_score == null || match.team2_score == null) return null;
  const isSets = scoringGroup(scoringSystem as never) === "sets";
  if (isSets && isSetsDetail(match.score_detail)) {
    return setsSummary(match.score_detail as SetsDetail);
  }
  return `${match.team1_score}–${match.team2_score}`;
}
