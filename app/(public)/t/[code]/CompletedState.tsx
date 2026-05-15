import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";
import {
  computeLiveLeaderboard,
  sortStrategyForFormat,
  type LeaderboardRow,
} from "@/lib/leaderboard";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import { aggregateEloChanges } from "@/lib/aggregate-elo-changes";
import type { Lang } from "@/lib/i18n/types";
import type { PublicTournamentView } from "@/lib/queries/public";
import type { Player } from "@/lib/types";
import { TournamentHeaderCard } from "./TournamentHeaderCard";
import { LeaderboardTable } from "./LeaderboardTable";
import { SeasonStandingsTable } from "./SeasonStandingsTable";

type Props = {
  view: PublicTournamentView;
  lang: Lang;
};

function podiumRank(rank: number): { medal: string; ring: string } {
  if (rank === 1) return { medal: "🥇", ring: "ring-accent" };
  if (rank === 2) return { medal: "🥈", ring: "ring-border" };
  return { medal: "🥉", ring: "ring-border" };
}

function Podium({
  rows,
  players,
  lang,
}: {
  rows: LeaderboardRow[];
  players: Player[];
  lang: Lang;
}) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
      <h2 className="text-lg font-semibold text-black">
        {translate(lang, "public.top_3")}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top.map((row, i) => {
          const rank = i + 1;
          const { medal, ring } = podiumRank(rank);
          const player = byId.get(row.playerId);
          return (
            <div
              key={row.playerId}
              className={`flex items-center gap-3 rounded-md border border-border bg-[var(--bg-page)] px-4 py-3 ring-2 ${ring}`}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {medal}
              </span>
              <Avatar
                name={row.playerName}
                photoUrl={player?.photo_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black">
                  {row.playerName}
                </p>
                <p className="text-xs text-secondary">
                  {row.points} ·{" "}
                  <span className="tabular-nums">
                    {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
                  </span>
                </p>
              </div>
              {player ? <Badge tone="level">{player.level}</Badge> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CompletedState({ view, lang }: Props) {
  const {
    tournament,
    players,
    ratingHistory,
    allCompletedMatches,
    leagueSeason,
    leagueSessionMatches,
    registrations,
  } = view;

  const strategy = sortStrategyForFormat(tournament.format);
  const rows = computeLiveLeaderboard(
    allCompletedMatches,
    players,
    strategy,
    tournament.scoring_system,
  );
  const eloChanges = aggregateEloChanges(ratingHistory);

  const seasonRows =
    tournament.type === "league_season" && leagueSeason
      ? computeSeasonLeaderboard(
          tournament,
          leagueSessionMatches.map(({ session, matches }) => ({
            session,
            matches,
            registrations: registrations.map((r) => ({
              player_id: r.player_id,
              partner_id: r.partner_id ?? null,
            })),
          })),
          players,
          leagueSeason.points_table,
          leagueSeason.qualification_spots,
        )
      : [];

  return (
    <div className="flex flex-col gap-4">
      <TournamentHeaderCard tournament={tournament} lang={lang} />

      {tournament.type === "league_season" && seasonRows.length > 0 ? (
        <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
          <h2 className="text-lg font-semibold text-black">
            {translate(lang, "public.cumulative_standings")}
          </h2>
          <div className="mt-4">
            <SeasonStandingsTable rows={seasonRows} lang={lang} />
          </div>
        </section>
      ) : (
        <Podium rows={rows} players={players} lang={lang} />
      )}

      <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-semibold text-black">
          {translate(lang, "public.results_title")}
        </h2>
        <div className="mt-4">
          <LeaderboardTable
            rows={rows}
            players={players}
            eloChanges={eloChanges}
            lang={lang}
            showElo
          />
        </div>
      </section>
    </div>
  );
}
