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
import {
  FORMAT_LABEL_RU,
  STATUS_LABEL_RU,
  TYPE_LABEL_RU,
} from "@/lib/constants";
import { formatDateRangeRu, formatDateRu, formatTimeRu } from "@/lib/format-date";
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

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournament(id);
  if (!t) notFound();

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
        ? `Уровень ${t.level_min}`
        : `Уровни ${t.level_min} – ${t.level_max}`
      : "Все уровни";

  const dateRange = formatDateRangeRu(t.date_start, t.date_end);
  const startTimeStr = formatTimeRu(t.start_time);
  const dateValue = startTimeStr ? `${dateRange} · ${startTimeStr}` : dateRange;

  const canAdd = isLeague
    ? t.status !== "completed"
    : t.status === "draft" || t.status === "registration_open";

  const headerAction = (
    <Link href="/">
      <Button variant="secondary" size="md">
        Назад
      </Button>
    </Link>
  );

  const infoCard = (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="format">{FORMAT_LABEL_RU[t.format]}</Badge>
        <Badge tone={statusTone(t.status)}>{STATUS_LABEL_RU[t.status]}</Badge>
        <Badge tone="neutral">{TYPE_LABEL_RU[t.type]}</Badge>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Row label="Даты" value={dateValue} />
        <Row label="Уровни" value={levelRange} />
        <Row
          label="Макс. игроков"
          value={t.max_players ? String(t.max_players) : "—"}
        />
        <Row
          label="Взнос"
          value={t.entry_fee > 0 ? `${t.entry_fee} ₽` : "Бесплатно"}
        />
        {t.prize_description ? (
          <Row label="Приз" value={t.prize_description} wide />
        ) : null}
        {t.notes ? <Row label="Заметки" value={t.notes} wide /> : null}
      </dl>
    </Card>
  );

  if (isLeague) {
    const [sessions, league] = await Promise.all([
      listSessionsByTournament(id),
      getLeagueSeason(id),
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

    return (
      <PageShell title={t.name} action={headerAction}>
        <div className="flex flex-col gap-6 max-w-3xl">
          {infoCard}

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                Сессии · {sessions.length}
              </h2>
              {league?.finals_date ? (
                <span className="text-xs text-muted">
                  Финал: {formatDateRu(league.finals_date)}
                </span>
              ) : null}
            </div>
            <SessionsList tournamentId={t.id} sessions={sessions} />
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                Турнирная таблица лиги
              </h2>
              <Link
                href={`/tournament/${t.id}/season`}
                className="text-sm text-accent underline-offset-2 hover:underline"
              >
                Подробнее →
              </Link>
            </div>
            {topRows.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 py-8 border border-dashed border-border rounded-[var(--radius-button)] bg-subtle/60">
                <div className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center">
                  <span className="h-2 w-2 rounded-sm bg-muted" />
                </div>
                <p className="text-sm text-black font-medium">
                  Сезон только начинается
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Очки будут начислены после первой завершённой сессии.
                  Квалификационных мест в финал: {league?.qualification_spots ?? 0}.
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
                        <Badge tone="qualified">В финал</Badge>
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
              Квалификационных мест: {league?.qualification_spots ?? 0}
            </p>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">
                Участники лиги · {registrations.length}
                {t.max_players ? ` / ${t.max_players}` : ""}
              </h2>
            </div>

            {registrations.length === 0 ? (
              <p className="text-sm text-muted">Игроков пока нет.</p>
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

  return (
    <PageShell title={t.name} action={headerAction}>
      <div className="flex flex-col gap-6 max-w-3xl">
        {infoCard}

        {t.status === "draft" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Следующий шаг</h2>
            <p className="text-sm text-muted">
              Откройте регистрацию, чтобы начать добавлять игроков.
            </p>
            <div>
              <OpenRegistrationButton tournamentId={t.id} />
            </div>
          </Card>
        ) : null}

        {t.status === "in_progress" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Турнир идёт</h2>
            <p className="text-sm text-muted">
              Перейдите на экран живой игры, чтобы вводить счёт.
            </p>
            <div>
              <Link href={`/tournament/${t.id}/play`}>
                <Button size="lg">Экран живой игры</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {t.status === "completed" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Турнир завершён</h2>
            <div>
              <Link href={`/tournament/${t.id}/results`}>
                <Button size="lg">Итоги турнира</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-black">
              Игроки · {registrations.length}
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
            <p className="text-sm text-muted">Игроков пока нет.</p>
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
