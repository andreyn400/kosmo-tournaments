import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";
import type { SeasonLeaderboardRow } from "@/lib/season-leaderboard";

type Props = {
  rows: SeasonLeaderboardRow[];
  lang: Lang;
};

function rankClass(rank: number): string {
  if (rank === 1) return "text-accent font-bold";
  if (rank === 2 || rank === 3) return "text-black font-semibold";
  return "text-secondary";
}

export function SeasonStandingsTable({ rows, lang }: Props) {
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
            <th className="h-9 px-3 text-right font-medium">
              {translate(lang, "public.matches_header")}
            </th>
            <th className="h-9 px-3 text-right font-medium">
              {translate(lang, "public.points_header")}
            </th>
            <th className="h-9 px-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rank = i + 1;
            return (
              <tr
                key={row.playerId}
                className="h-11 border-t border-border"
              >
                <td className={`px-3 ${rankClass(rank)}`}>{rank}</td>
                <td className="px-3 text-black">{row.playerName}</td>
                <td className="px-3 text-right tabular-nums text-secondary">
                  {row.sessionsPlayed}
                </td>
                <td className="px-3 text-right tabular-nums font-semibold text-black">
                  {row.totalPoints}
                </td>
                <td className="px-3">
                  {row.qualified ? (
                    <Badge tone="qualified">
                      {translate(lang, "public.qualification_badge")}
                    </Badge>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
