import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import { listPlayers } from "@/lib/queries/players";
import { getLeagueSeason } from "@/lib/queries/league-seasons";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import type { Match } from "@/lib/types";

export default async function SeasonLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();
  if (tournament.type !== "league_season") notFound();

  const [sessions, league, registrations, players] = await Promise.all([
    listSessionsByTournament(id),
    getLeagueSeason(id),
    listRegistrations(id),
    listPlayers(),
  ]);

  if (!league) notFound();

  const completed = sessions.filter((s) => s.status === "completed");
  const sessionInputs = await Promise.all(
    completed.map(async (s) => {
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

  const rows = computeSeasonLeaderboard(
    tournament,
    sessionInputs,
    players,
    league.points_table,
    league.qualification_spots,
  );

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <PageShell
      title={`Таблица · ${tournament.name}`}
      action={
        <Link href={`/tournament/${id}`}>
          <Button variant="secondary" size="md">
            К лиге
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-6 max-w-4xl">
        <Link
          href={`/tournament/${id}`}
          className="text-sm text-muted hover:text-black inline-flex items-center gap-1.5 self-start"
        >
          <span aria-hidden>←</span> К лиге · {tournament.name}
        </Link>
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <h2 className="font-semibold text-black">Турнирная таблица</h2>
              <p className="text-xs text-muted">
                Сессий сыграно: {completed.length} из {sessions.length}
                {" · "}Квалификационных мест: {league.qualification_spots}
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 py-12 border border-dashed border-border rounded-[var(--radius-button)] bg-subtle/60">
              <div className="h-12 w-12 rounded-full bg-white border border-border flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-black">
                  Нет завершённых сессий
                </h3>
                <p className="text-sm text-muted max-w-sm">
                  Таблица обновится автоматически, как только директор
                  завершит первую сессию.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-[var(--radius-button)]">
              <table className="w-full text-sm">
                <thead className="bg-subtle">
                  <tr className="text-left text-xs text-muted uppercase tracking-wider">
                    <th className="px-3 py-2 w-10">#</th>
                    <th className="px-3 py-2">Игрок</th>
                    <th className="px-3 py-2 w-16">Ур.</th>
                    <th className="px-3 py-2 w-14 text-right">Очки</th>
                    <th className="px-3 py-2 w-14 text-right">С</th>
                    <th className="px-3 py-2 w-14 text-right">Луч.</th>
                    <th className="px-3 py-2 w-16 text-right">Средн.</th>
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {rows.map((row, idx) => {
                    const p = playerById.get(row.playerId);
                    return (
                      <tr key={row.playerId}>
                        <td className="px-3 py-2 tabular-nums text-muted">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-black">
                          {row.playerName}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {p?.level ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-black tabular-nums">
                          {row.totalPoints}
                        </td>
                        <td className="px-3 py-2 text-right text-muted tabular-nums">
                          {row.sessionsPlayed}
                        </td>
                        <td className="px-3 py-2 text-right text-muted tabular-nums">
                          {row.bestPosition ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-muted tabular-nums">
                          {row.averagePoints.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.qualified ? (
                            <Badge tone="qualified">В финал</Badge>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
