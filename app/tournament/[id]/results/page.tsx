import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { listRatingHistoryByTournament } from "@/lib/queries/rating-history";
import { listRegistrations } from "@/lib/queries/registrations";
import { listDivisions } from "@/lib/queries/divisions";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
  sortStrategyForFormat,
} from "@/lib/leaderboard";
import { aggregateEloChanges } from "@/lib/aggregate-elo-changes";
import {
  DIVISION_CATEGORY_LABEL_RU,
  FORMAT_LABEL_RU,
  STATUS_LABEL_RU,
} from "@/lib/constants";
import { formatDateRangeRu } from "@/lib/format-date";
import { statusTone } from "@/lib/status-tone";
import { ShareButton } from "./ShareButton";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const divisions = await listDivisions(id);

  if (divisions.length > 0) {
    return (
      <PageShell
        title={tournament.name}
        action={
          <div className="flex items-center gap-2">
            <ShareButton />
            <Link href={`/tournament/${id}`}>
              <Button variant="secondary" size="md">
                К турниру
              </Button>
            </Link>
          </div>
        }
      >
        <div className="flex flex-col gap-6 max-w-3xl">
          <Card className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(tournament.status)}>
                {STATUS_LABEL_RU[tournament.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted">
              {formatDateRangeRu(tournament.date_start, tournament.date_end)} ·{" "}
              Дивизионов: {divisions.length}
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Дивизионы</h2>
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {divisions.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white text-sm"
                >
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <span className="text-black truncate font-medium">
                      {d.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">
                        {DIVISION_CATEGORY_LABEL_RU[d.category]}
                      </Badge>
                      <Badge tone="format">{FORMAT_LABEL_RU[d.format]}</Badge>
                      <Badge tone={statusTone(d.status)}>
                        {STATUS_LABEL_RU[d.status]}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href={`/tournament/${id}/division/${d.id}/results`}
                    className="shrink-0"
                  >
                    <Button variant="secondary" size="sm">
                      Итоги →
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {tournament.prize_description ? (
            <Card className="flex flex-col gap-1">
              <span className="text-xs text-muted uppercase tracking-wider">
                Приз
              </span>
              <p className="text-black">{tournament.prize_description}</p>
            </Card>
          ) : null}
        </div>
      </PageShell>
    );
  }

  const [sessions, players, history, registrations] = await Promise.all([
    listSessionsByTournament(id),
    listPlayers(),
    listRatingHistoryByTournament(id),
    listRegistrations(id),
  ]);
  const isTeamFormat =
    tournament.format === "team_americano" ||
    tournament.format === "team_mexicano";
  const pairs = isTeamFormat ? pairsFromRegistrations(registrations) : [];

  const session = sessions[sessions.length - 1] ?? null;
  const rounds = session ? await listRoundsBySession(session.id) : [];
  const matchLists = await Promise.all(
    rounds.map((r) => listMatchesByRound(r.id)),
  );
  const completedMatches = matchLists
    .flat()
    .filter((m) => m.status === "completed");

  const playerById = new Map(players.map((p) => [p.id, p]));
  const strategy = sortStrategyForFormat(tournament.format);
  const leaderboard = isTeamFormat
    ? []
    : computeLiveLeaderboard(completedMatches, players, strategy);
  const pairLeaderboard = isTeamFormat
    ? computePairLeaderboard(completedMatches, players, pairs, strategy)
    : [];
  const eloChanges = aggregateEloChanges(history);
  const playerCount = isTeamFormat ? pairs.length * 2 : leaderboard.length;

  return (
    <PageShell
      title={tournament.name}
      action={
        <div className="flex items-center gap-2">
          <ShareButton />
          <Link href={`/tournament/${id}`}>
            <Button variant="secondary" size="md">
              К турниру
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="format">{FORMAT_LABEL_RU[tournament.format]}</Badge>
            <Badge tone={statusTone(tournament.status)}>
              {STATUS_LABEL_RU[tournament.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted">
            {formatDateRangeRu(tournament.date_start, tournament.date_end)} ·{" "}
            {playerCount} игроков · {completedMatches.length} матчей
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">Итоговая таблица</h2>

          {isTeamFormat ? (
            pairLeaderboard.length === 0 ? (
              <p className="text-sm text-muted">Нет завершённых матчей.</p>
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
                          {strategy === "wins"
                            ? `${row.wins} побед · ${row.matchesPlayed} матч · +/− ${formatSigned(row.plusMinus)}`
                            : `${row.matchesPlayed} матч · +/− ${formatSigned(row.plusMinus)}`}
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
            <p className="text-sm text-muted">Нет завершённых матчей.</p>
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
                        {strategy === "wins"
                          ? `${row.wins} побед · ${row.matchesPlayed} матч · +/− ${formatSigned(row.plusMinus)}`
                          : `${row.matchesPlayed} матч · +/− ${formatSigned(row.plusMinus)}`}
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

        {tournament.prize_description ? (
          <Card className="flex flex-col gap-1">
            <span className="text-xs text-muted uppercase tracking-wider">
              Приз
            </span>
            <p className="text-black">{tournament.prize_description}</p>
          </Card>
        ) : null}
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
