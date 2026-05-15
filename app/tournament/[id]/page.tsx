import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { listRegistrations } from "@/lib/queries/registrations";
import { listPlayers } from "@/lib/queries/players";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { getLeagueSeason } from "@/lib/queries/league-seasons";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listDivisions } from "@/lib/queries/divisions";
import { listActiveCourts, listCourtsByIds } from "@/lib/queries/courts";
import { getServerLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n";
import {
  TOURNAMENT_FORMAT_KEY,
  TOURNAMENT_STATUS_KEY,
} from "@/lib/i18n/tournament-keys";
import { TOURNAMENT_TYPE_KEY } from "@/lib/i18n/calendar-keys";
import { formatDate, formatDateRange, formatTime } from "@/lib/i18n/format";
import { statusTone } from "@/lib/status-tone";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import type { Match } from "@/lib/types";
import { AddPlayerPanel } from "./AddPlayerPanel";
import { AddPairPanel } from "./AddPairPanel";
import { RegistrationRow } from "./RegistrationRow";
import { OpenRegistrationButton } from "./OpenRegistrationButton";
import { StartTournamentButton } from "./StartTournamentButton";
import { SessionsList } from "./SessionsList";
import { DangerZone } from "./DangerZone";
import { DivisionsPanel } from "./DivisionsPanel";
import { EditTournamentPanel } from "./EditTournamentPanel";
import { LeagueSettingsPanel } from "./LeagueSettingsPanel";
import { SharePanel } from "@/components/share/SharePanel";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournament(id);
  if (!t) notFound();

  const lang = await getServerLang();
  const tr = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) =>
    translate(lang, key, vars);

  const [registrations, allPlayers] = await Promise.all([
    listRegistrations(id),
    listPlayers(),
  ]);
  const registeredIds = new Set(registrations.map((r) => r.player_id));
  const isTeamFormat =
    t.format === "team_americano" || t.format === "team_mexicano";
  const isLeague = t.type === "league_season";
  const playerNameById = new Map(allPlayers.map((p) => [p.id, p.name]));

  const levelRange =
    t.level_min && t.level_max
      ? t.level_min === t.level_max
        ? tr("level.level_one", { level: t.level_min })
        : tr("level.level_range", { min: t.level_min, max: t.level_max })
      : tr("level.all_levels");

  const dateRange = formatDateRange(t.date_start, t.date_end, lang);
  const startTimeStr = formatTime(t.start_time);
  const dateValue = startTimeStr ? `${dateRange} · ${startTimeStr}` : dateRange;

  const canAdd = isLeague
    ? t.status !== "completed"
    : t.status === "draft" || t.status === "registration_open";

  const headerAction = (
    <Link href="/">
      <Button variant="secondary" size="md">
        {tr("btn.back")}
      </Button>
    </Link>
  );

  const infoCardContent = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="format">{tr(TOURNAMENT_FORMAT_KEY[t.format])}</Badge>
        <Badge tone={statusTone(t.status)}>{tr(TOURNAMENT_STATUS_KEY[t.status])}</Badge>
        <Badge tone="neutral">{tr(TOURNAMENT_TYPE_KEY[t.type])}</Badge>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Row label={tr("tournament.detail.field.dates")} value={dateValue} />
        <Row label={tr("tournament.detail.field.levels")} value={levelRange} />
        <Row
          label={tr("tournament.detail.field.max_players")}
          value={t.max_players ? String(t.max_players) : "—"}
        />
        <Row
          label={tr("tournament.detail.field.entry_fee")}
          value={
            t.entry_fee > 0
              ? `${t.entry_fee} ₽`
              : tr("tournament.detail.field.entry_fee_free")
          }
        />
        {t.prize_description ? (
          <Row
            label={tr("tournament.detail.field.prize")}
            value={t.prize_description}
            wide
          />
        ) : null}
        {t.notes ? (
          <Row
            label={tr("tournament.detail.field.notes")}
            value={t.notes}
            wide
          />
        ) : null}
      </dl>
    </>
  );

  const infoCard = (
    <Card className="flex flex-col gap-4">{infoCardContent}</Card>
  );

  if (isLeague) {
    const [sessions, league, activeCourts] = await Promise.all([
      listSessionsByTournament(id),
      getLeagueSeason(id),
      listActiveCourts(),
    ]);

    const completedSessions = sessions.filter((s) => s.status === "completed");
    const sessionInputs = await Promise.all(
      completedSessions.map(async (s) => {
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

    const leaderboard = league
      ? computeSeasonLeaderboard(
          t,
          sessionInputs,
          allPlayers,
          league.points_table,
          league.qualification_spots,
        )
      : [];

    const topRows = leaderboard.slice(0, 5);

    const allSessionsCompleted =
      sessions.length > 0 && sessions.every((s) => s.status === "completed");
    const qualifiedCount = leaderboard.filter((r) => r.qualified).length;
    const requiredSpots = league?.qualification_spots ?? 0;
    const finalsStatus = league?.finals_status ?? "not_created";

    const finalsCard =
      finalsStatus === "in_progress" ? (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            {tr("tournament.league.finals_in_progress_title")}
          </h2>
          <p className="text-sm text-muted">
            {tr("tournament.league.finals_in_progress_copy")}
          </p>
          <div>
            <Link href={`/tournament/${t.id}/finals`}>
              <Button size="lg">
                {tr("tournament.league.finals_in_progress_cta")}
              </Button>
            </Link>
          </div>
        </Card>
      ) : finalsStatus === "completed" ? (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            {tr("tournament.league.finals_completed_title")}
          </h2>
          <div>
            <Link href={`/tournament/${t.id}/finals/results`}>
              <Button size="lg">
                {tr("tournament.league.finals_results_cta")}
              </Button>
            </Link>
          </div>
        </Card>
      ) : allSessionsCompleted && qualifiedCount >= requiredSpots ? (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            {tr("tournament.league.season_completed_title")}
          </h2>
          <p className="text-sm text-muted">
            {tr("tournament.league.season_completed_copy", {
              q: qualifiedCount,
              total: requiredSpots,
            })}
          </p>
          <div>
            <Link href={`/tournament/${t.id}/finals/setup`}>
              <Button size="lg">{tr("tournament.league.create_finals_cta")}</Button>
            </Link>
          </div>
        </Card>
      ) : null;

    return (
      <PageShell title={t.name} action={headerAction}>
        <div className="flex flex-col gap-6 max-w-3xl">
          <Card className="flex flex-col gap-4">
            {infoCardContent}
            <EditTournamentPanel tournament={t} allCourts={activeCourts} />
          </Card>

          <SharePanel shortCode={t.short_code} tournamentName={t.name} />

          {league ? (
            <Card>
              <LeagueSettingsPanel
                tournamentId={t.id}
                qualificationSpots={league.qualification_spots}
                finalsDate={league.finals_date}
                finalsScoringSystem={league.finals_scoring_system}
                finalsStatus={league.finals_status}
              />
            </Card>
          ) : null}

          {finalsCard}

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                {tr("tournament.league.sessions_title")} · {sessions.length}
              </h2>
              {league?.finals_date ? (
                <span className="text-xs text-muted">
                  {tr("tournament.league.finals_date", {
                    date: formatDate(league.finals_date, lang),
                  })}
                </span>
              ) : null}
            </div>
            <SessionsList tournamentId={t.id} sessions={sessions} />
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                {tr("tournament.league.standings_title")}
              </h2>
              <Link
                href={`/tournament/${t.id}/season`}
                className="text-sm text-accent underline-offset-2 hover:underline"
              >
                {tr("tournament.league.standings_more")}
              </Link>
            </div>
            {topRows.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 py-8 border border-dashed border-border rounded-[var(--radius-button)] bg-subtle/60">
                <div className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center">
                  <span className="h-2 w-2 rounded-sm bg-muted" />
                </div>
                <p className="text-sm text-black font-medium">
                  {tr("tournament.league.season_started_title")}
                </p>
                <p className="text-xs text-muted max-w-xs">
                  {tr("tournament.league.season_started_copy", {
                    n: league?.qualification_spots ?? 0,
                  })}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
                {topRows.map((row, idx) => (
                  <li
                    key={row.playerId}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-muted tabular-nums text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-black truncate">
                        {row.playerName}
                      </span>
                      {row.qualified ? (
                        <Badge tone="qualified">
                          {tr("tournament.league.qualified_badge")}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-black font-semibold tabular-nums">
                      {row.totalPoints}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">
              {tr("tournament.league.qualification_spots", {
                n: league?.qualification_spots ?? 0,
              })}
            </p>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                {tr("tournament.league.participants_title")} · {registrations.length}
                {t.max_players ? ` / ${t.max_players}` : ""}
              </h2>
            </div>

            {registrations.length === 0 ? (
              <p className="text-sm text-muted">
                {tr("tournament.detail.no_players")}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
                {registrations.map((r, idx) => (
                  <RegistrationRow
                    key={r.id}
                    index={idx}
                    tournamentId={t.id}
                    registrationId={r.id}
                    player={r.player}
                    partnerName={
                      isTeamFormat && r.partner_id
                        ? (playerNameById.get(r.partner_id) ?? null)
                        : null
                    }
                    canRemove={canAdd}
                  />
                ))}
              </ul>
            )}

            {canAdd ? (
              <div className="pt-2 border-t border-border">
                <AddPlayerPanel
                  tournamentId={t.id}
                  allPlayers={allPlayers}
                  registeredIds={registeredIds}
                />
              </div>
            ) : null}
          </Card>

          <DangerZone
            tournamentId={t.id}
            tournamentName={t.name}
            tournamentType={t.type}
          />
        </div>
      </PageShell>
    );
  }

  const [divisions, tournamentCourts] = await Promise.all([
    listDivisions(id),
    t.court_ids.length > 0 ? listCourtsByIds(t.court_ids) : Promise.resolve([]),
  ]);

  return (
    <PageShell title={t.name} action={headerAction}>
      <div className="flex flex-col gap-6 max-w-3xl">
        {infoCard}

        <SharePanel shortCode={t.short_code} tournamentName={t.name} />

        {t.status === "draft" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">
              {tr("tournament.detail.next_step_title")}
            </h2>
            <p className="text-sm text-muted">
              {tr("tournament.detail.next_step_copy")}
            </p>
            <div>
              <OpenRegistrationButton tournamentId={t.id} />
            </div>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-4">
          <DivisionsPanel
            tournamentId={t.id}
            tournamentCourts={tournamentCourts}
            tournamentDefaults={{
              format: t.format,
              scoring_system: t.scoring_system,
              level_min: t.level_min,
              level_max: t.level_max,
              court_ids: t.court_ids,
            }}
            divisions={divisions}
          />
        </Card>

        {t.status === "in_progress" && divisions.length === 0 ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">
              {tr("tournament.detail.in_progress_title")}
            </h2>
            <p className="text-sm text-muted">
              {tr("tournament.detail.in_progress_copy")}
            </p>
            <div>
              <Link href={`/tournament/${t.id}/play`}>
                <Button size="lg">{tr("tournament.detail.live_screen_cta")}</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {t.status === "completed" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">
              {tr("tournament.detail.completed_title")}
            </h2>
            <div>
              <Link href={`/tournament/${t.id}/results`}>
                <Button size="lg">{tr("tournament.detail.results_cta")}</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {divisions.length === 0 ? (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                {tr("tournament.detail.players_title")} · {registrations.length}
                {t.max_players ? ` / ${t.max_players}` : ""}
              </h2>
              {t.status === "registration_open" ? (
                <StartTournamentButton
                  tournamentId={t.id}
                  playerCount={registrations.length}
                />
              ) : null}
            </div>

            {registrations.length === 0 ? (
              <p className="text-sm text-muted">
                {tr("tournament.detail.no_players")}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
                {registrations.map((r, idx) => (
                  <RegistrationRow
                    key={r.id}
                    index={idx}
                    tournamentId={t.id}
                    registrationId={r.id}
                    player={r.player}
                    partnerName={
                      isTeamFormat && r.partner_id
                        ? (playerNameById.get(r.partner_id) ?? null)
                        : null
                    }
                    canRemove={canAdd}
                  />
                ))}
              </ul>
            )}

            {canAdd ? (
              <div className="pt-2 border-t border-border">
                {isTeamFormat ? (
                  <AddPairPanel
                    tournamentId={t.id}
                    allPlayers={allPlayers}
                    registeredIds={registeredIds}
                  />
                ) : (
                  <AddPlayerPanel
                    tournamentId={t.id}
                    allPlayers={allPlayers}
                    registeredIds={registeredIds}
                  />
                )}
              </div>
            ) : null}
          </Card>
        ) : null}

        <DangerZone
          tournamentId={t.id}
          tournamentName={t.name}
          tournamentType={t.type}
        />
      </div>
    </PageShell>
  );
}

function Row({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide ? "sm:col-span-2 flex flex-col gap-0.5" : "flex flex-col gap-0.5"
      }
    >
      <dt className="text-xs text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-black">{value}</dd>
    </div>
  );
}
