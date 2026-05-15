import { translate } from "@/lib/i18n";
import {
  computeLiveLeaderboard,
  sortStrategyForFormat,
} from "@/lib/leaderboard";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import { formatShortDateWithWeekday } from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n/types";
import type { PublicTournamentView } from "@/lib/queries/public";
import { TournamentHeaderCard } from "./TournamentHeaderCard";
import { LeaderboardTable } from "./LeaderboardTable";
import { LiveRefreshWrapper } from "./LiveRefreshWrapper";
import { SeasonStandingsTable } from "./SeasonStandingsTable";

type Props = {
  view: PublicTournamentView;
  lang: Lang;
};

export function LiveState({ view, lang }: Props) {
  const {
    tournament,
    activeSession,
    activeRounds,
    activeMatches,
    players,
    leagueSeason,
    leagueSessionMatches,
    sessions,
  } = view;

  const matchIds = activeMatches.map((m) => m.id);
  const roundIds = activeRounds.map((r) => r.id);

  const strategy = sortStrategyForFormat(tournament.format);
  const rows = computeLiveLeaderboard(
    activeMatches,
    players,
    strategy,
    tournament.scoring_system,
  );

  const totalRounds = activeRounds.length;
  const currentRound = activeRounds.find((r) => r.status === "in_progress");
  const currentRoundNumber = currentRound
    ? currentRound.round_number
    : Math.max(
        1,
        activeRounds.filter((r) => r.status === "completed").length,
      );

  const seasonRows =
    tournament.type === "league_season" && leagueSeason
      ? computeSeasonLeaderboard(
          tournament,
          leagueSessionMatches.map(({ session, matches }) => ({
            session,
            matches,
            registrations: view.registrations.map((r) => ({
              player_id: r.player_id,
              partner_id: r.partner_id ?? null,
            })),
          })),
          players,
          leagueSeason.points_table,
          leagueSeason.qualification_spots,
        )
      : [];

  const nextSession =
    tournament.type === "league_season"
      ? sessions.find((s) => s.status === "scheduled")
      : null;

  const showLiveLeaderboard =
    activeSession != null && activeMatches.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <TournamentHeaderCard tournament={tournament} lang={lang} />

      <LiveRefreshWrapper matchIds={matchIds} roundIds={roundIds} lang={lang}>
        {showLiveLeaderboard ? (
          <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-black">
                {translate(lang, "public.leaderboard_title")}
              </h2>
              {totalRounds > 0 ? (
                <p className="text-sm text-secondary">
                  {translate(lang, "public.round_indicator", {
                    current: currentRoundNumber,
                    total: totalRounds,
                  })}
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <LeaderboardTable rows={rows} players={players} lang={lang} />
            </div>
            <p className="mt-3 text-right text-xs text-muted">
              {translate(lang, "public.updates_live_note")}
            </p>
          </section>
        ) : (
          <section className="rounded-lg bg-[var(--bg-surface)] p-5 text-center shadow-md sm:p-6">
            <p className="text-sm text-secondary">
              {translate(lang, "public.no_active_session")}
            </p>
            {nextSession ? (
              <p className="mt-2 text-sm font-medium text-black">
                {translate(lang, "public.next_session", {
                  date: formatShortDateWithWeekday(
                    nextSession.session_date,
                    lang,
                  ),
                })}
              </p>
            ) : null}
          </section>
        )}

        {tournament.type === "league_season" && seasonRows.length > 0 ? (
          <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
            <h2 className="text-lg font-semibold text-black">
              {translate(lang, "public.cumulative_standings")}
            </h2>
            <div className="mt-4">
              <SeasonStandingsTable rows={seasonRows} lang={lang} />
            </div>
          </section>
        ) : null}
      </LiveRefreshWrapper>
    </div>
  );
}
