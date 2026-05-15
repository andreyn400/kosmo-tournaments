import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision } from "@/lib/queries/divisions";
import { listMatchesByDivision } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listRatingHistoryByTournament } from "@/lib/queries/rating-history";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
  sortStrategyForFormat,
} from "@/lib/leaderboard";
import { aggregateEloChanges } from "@/lib/aggregate-elo-changes";
import { getServerLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n";
import {
  TOURNAMENT_FORMAT_KEY,
  TOURNAMENT_STATUS_KEY,
} from "@/lib/i18n/tournament-keys";
import { DIVISION_CATEGORY_KEY } from "@/lib/i18n/scoring-keys";
import { statusTone } from "@/lib/status-tone";
import { SharePanel } from "@/components/share/SharePanel";

export default async function DivisionResultsPage({
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

  const [players, history, registrations, divisionMatches] = await Promise.all([
    listPlayers(),
    listRatingHistoryByTournament(id),
    listRegistrationsByDivision(divisionId),
    listMatchesByDivision(divisionId),
  ]);

  const isTeamFormat =
    division.format === "team_americano" ||
    division.format === "team_mexicano";
  const pairs = isTeamFormat ? pairsFromRegistrations(registrations) : [];

  const completedMatches = divisionMatches.filter(
    (m) => m.status === "completed",
  );

  const divisionPlayerIds = new Set(registrations.map((r) => r.player_id));
  const divisionHistory = history.filter((h) =>
    divisionPlayerIds.has(h.player_id),
  );

  const playerById = new Map(players.map((p) => [p.id, p]));
  const strategy = sortStrategyForFormat(division.format);
  const leaderboard = isTeamFormat
    ? []
    : computeLiveLeaderboard(completedMatches, players, strategy);
  const pairLeaderboard = isTeamFormat
    ? computePairLeaderboard(completedMatches, players, pairs, strategy)
    : [];
  const eloChanges = aggregateEloChanges(divisionHistory);
  const playerCount = isTeamFormat ? pairs.length * 2 : leaderboard.length;

  const backHref = `/tournament/${id}/division/${divisionId}`;
  const title = `${tournament.name} · ${division.name}`;

  const lang = await getServerLang();
  const tr = (
    key: Parameters<typeof translate>[1],
    vars?: Parameters<typeof translate>[2],
  ) => translate(lang, key, vars);

  const rowMeta = (
    wins: number,
    matches: number,
    plusMinus: number,
  ): string =>
    strategy === "wins"
      ? tr("results.row_meta_wins", {
          wins,
          matches,
          pm: formatSigned(plusMinus),
        })
      : tr("results.row_meta_matches", {
          matches,
          pm: formatSigned(plusMinus),
        });

  return (
    <PageShell
      title={title}
      action={
        <Link href={backHref}>
          <Button variant="secondary" size="md">
            {tr("results.back_to_division")}
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        <SharePanel
          shortCode={tournament.short_code}
          tournamentName={tournament.name}
        />

        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              {tr(DIVISION_CATEGORY_KEY[division.category])}
            </Badge>
            <Badge tone="format">
              {tr(TOURNAMENT_FORMAT_KEY[division.format])}
            </Badge>
            <Badge tone={statusTone(division.status)}>
              {tr(TOURNAMENT_STATUS_KEY[division.status])}
            </Badge>
          </div>
          <p className="text-sm text-muted">
            {tr("results.summary", {
              players: playerCount,
              matches: completedMatches.length,
            })}
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            {tr("results.leaderboard_title")}
          </h2>

          {isTeamFormat ? (
            pairLeaderboard.length === 0 ? (
              <p className="text-sm text-muted">{tr("results.no_matches")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
                {pairLeaderboard.map((row, idx) => {
                  const elo1 = eloChanges.get(row.playerIds[0]);
                  const elo2 = eloChanges.get(row.playerIds[1]);
                  const medal =
                    idx === 0
                      ? "🥇"
                      : idx === 1
                        ? "🥈"
                        : idx === 2
                          ? "🥉"
                          : null;
                  return (
                    <li
                      key={row.pairKey}
                      className="flex items-center gap-3 px-4 py-3 bg-white text-sm"
                    >
                      <div className="flex items-center gap-1.5 shrink-0 w-[3.25rem]">
                        <span className="text-base font-semibold text-black tabular-nums w-5">
                          {idx + 1}
                        </span>
                        {medal ? (
                          <span className="text-2xl leading-none">{medal}</span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <span className="text-black leading-tight">
                          {row.playerNames[0]} / {row.playerNames[1]}
                        </span>
                        <span className="text-xs text-muted">
                          {rowMeta(row.wins, row.matchesPlayed, row.plusMinus)}
                        </span>
                        {elo1 || elo2 ? (
                          <span className="text-xs text-muted hidden sm:block">
                            {elo1
                              ? `${row.playerNames[0]}: ${formatSigned(elo1.change)}`
                              : ""}
                            {elo1 && elo2 ? " · " : ""}
                            {elo2
                              ? `${row.playerNames[1]}: ${formatSigned(elo2.change)}`
                              : ""}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-lg font-bold tabular-nums text-black shrink-0 w-10 text-right">
                        {row.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted">{tr("results.no_matches")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {leaderboard.map((row, idx) => {
                const elo = eloChanges.get(row.playerId);
                const player = playerById.get(row.playerId);
                const medal =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                return (
                  <li
                    key={row.playerId}
                    className="flex items-center gap-3 px-4 py-3 bg-white text-sm"
                  >
                    <div className="flex items-center gap-1.5 shrink-0 w-[3.25rem]">
                      <span className="text-base font-semibold text-black tabular-nums w-5">
                        {idx + 1}
                      </span>
                      {medal ? (
                        <span className="text-2xl leading-none">{medal}</span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <span className="text-black truncate">
                        {player?.name ?? row.playerName}
                      </span>
                      <span className="text-xs text-muted">
                        {rowMeta(row.wins, row.matchesPlayed, row.plusMinus)}
                      </span>
                    </div>
                    {elo ? (
                      <EloCell
                        before={elo.eloBefore}
                        after={elo.eloAfter}
                        change={elo.change}
                      />
                    ) : null}
                    {player ? (
                      <Badge tone="level" className="hidden sm:inline-flex shrink-0">
                        {player.level}
                      </Badge>
                    ) : null}
                    <span className="text-lg font-bold tabular-nums text-black shrink-0 w-10 text-right">
                      {row.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function formatSigned(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function EloCell({
  before,
  after,
  change,
}: {
  before: number;
  after: number;
  change: number;
}) {
  const color =
    change > 0
      ? "text-[var(--color-success)]"
      : change < 0
        ? "text-[var(--color-accent)]"
        : "text-muted";
  return (
    <div className="hidden sm:flex items-baseline gap-2 shrink-0 whitespace-nowrap">
      <span className="text-xs text-muted tabular-nums">
        {before} → {after}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {change > 0 ? `+${change}` : change}
      </span>
    </div>
  );
}
