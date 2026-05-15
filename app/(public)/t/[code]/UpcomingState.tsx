import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { translate, tPlural } from "@/lib/i18n";
import { formatShortDateWithWeekday } from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n/types";
import type { PublicTournamentView } from "@/lib/queries/public";
import type { TournamentSession } from "@/lib/types";
import { TournamentHeaderCard } from "./TournamentHeaderCard";

type Props = {
  view: PublicTournamentView;
  lang: Lang;
};

function sessionStatusLabel(status: TournamentSession["status"], lang: Lang) {
  if (status === "in_progress")
    return translate(lang, "public.session.in_progress");
  if (status === "completed")
    return translate(lang, "public.session.completed");
  return translate(lang, "public.session.scheduled");
}

export function UpcomingState({ view, lang }: Props) {
  const { tournament, registrations, sessions } = view;
  const playerCount = registrations.length;
  const remaining =
    tournament.max_players != null
      ? Math.max(0, tournament.max_players - playerCount)
      : null;

  const isLeague = tournament.type === "league_season";

  return (
    <div className="flex flex-col gap-4">
      <TournamentHeaderCard tournament={tournament} lang={lang} showFee />

      {isLeague && sessions.length > 0 ? (
        <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
          <h2 className="text-lg font-semibold text-black">
            {translate(lang, "public.session_dates_header")}
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black">
                    {translate(lang, "public.session_number", {
                      n: s.session_number,
                    })}
                  </p>
                  <p className="text-xs text-secondary">
                    {formatShortDateWithWeekday(s.session_date, lang)}
                  </p>
                </div>
                <Badge
                  tone={
                    s.status === "completed"
                      ? "status-completed"
                      : s.status === "in_progress"
                        ? "status-progress"
                        : "status-draft"
                  }
                >
                  {sessionStatusLabel(s.status, lang)}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-black">
            {translate(lang, "public.players_registered")}
          </h2>
          <p className="text-sm text-secondary">
            {tPlural(
              lang,
              playerCount,
              {
                one: "public.players_count.one",
                few: "public.players_count.few",
                many: "public.players_count.many",
              },
              { count: playerCount },
            )}
            {remaining != null
              ? ` · ${tPlural(
                  lang,
                  remaining,
                  {
                    one: "public.spots_remaining.one",
                    few: "public.spots_remaining.few",
                    many: "public.spots_remaining.many",
                  },
                  { count: remaining },
                )}`
              : ""}
          </p>
        </div>

        {playerCount === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {translate(lang, "public.no_players_yet")}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {registrations.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md border border-border bg-[var(--bg-page)] px-3 py-2"
              >
                <Avatar
                  name={r.player.name}
                  photoUrl={r.player.photo_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {r.player.name}
                  </p>
                </div>
                <Badge tone="level">{r.player.level}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
