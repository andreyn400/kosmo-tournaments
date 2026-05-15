import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";
import type { LeaderboardRow } from "@/lib/leaderboard";
import type { Player } from "@/lib/types";
import type { EloChangeSummary } from "@/lib/aggregate-elo-changes";

type Props = {
  rows: LeaderboardRow[];
  players: Player[];
  eloChanges?: Map<string, EloChangeSummary>;
  lang: Lang;
  showElo?: boolean;
};

function rankClass(rank: number): string {
  if (rank === 1) return "text-accent font-bold";
  if (rank === 2 || rank === 3) return "text-black font-semibold";
  return "text-secondary";
}

export function LeaderboardTable({
  rows,
  players,
  eloChanges,
  lang,
  showElo,
}: Props) {
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="h-9 px-3 font-medium">
              {translate(lang, "public.rank_header")}
            </th>
            <th className="h-9 px-3 font-medium">
              {translate(lang, "public.player_header")}
            </th>
            <th className="h-9 px-3 font-medium">
              {translate(lang, "public.level_header")}
            </th>
            <th className="h-9 px-3 text-right font-medium">
              {translate(lang, "public.plus_minus_header")}
            </th>
            <th className="h-9 px-3 text-right font-medium">
              {translate(lang, "public.points_header")}
            </th>
            {showElo ? (
              <th className="h-9 px-3 text-right font-medium">
                {translate(lang, "public.elo_change_header")}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rank = i + 1;
            const player = byId.get(row.playerId);
            const elo = eloChanges?.get(row.playerId);
            return (
              <tr
                key={row.playerId}
                className="h-11 border-t border-border"
              >
                <td className={`px-3 ${rankClass(rank)}`}>{rank}</td>
                <td className="px-3 text-black">{row.playerName}</td>
                <td className="px-3">
                  {player ? <Badge tone="level">{player.level}</Badge> : null}
                </td>
                <td className="px-3 text-right tabular-nums text-secondary">
                  {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
                </td>
                <td className="px-3 text-right tabular-nums font-semibold text-black">
                  {row.points}
                </td>
                {showElo ? (
                  <td className="px-3 text-right tabular-nums">
                    {elo ? (
                      <span
                        className={
                          elo.change > 0
                            ? "text-success"
                            : elo.change < 0
                              ? "text-warning"
                              : "text-muted"
                        }
                      >
                        {elo.change > 0 ? `+${elo.change}` : elo.change}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
