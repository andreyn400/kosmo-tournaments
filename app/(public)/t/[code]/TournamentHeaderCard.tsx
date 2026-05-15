import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";
import {
  formatDateRange,
  formatLongDateWithWeekday,
  formatTime,
} from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n/types";
import { TOURNAMENT_FORMAT_KEY } from "@/lib/i18n/tournament-keys";
import type { Tournament } from "@/lib/types";

type Props = {
  tournament: Tournament;
  lang: Lang;
  showFee?: boolean;
};

function statusBadge(status: Tournament["status"], lang: Lang) {
  switch (status) {
    case "in_progress":
      return (
        <Badge tone="status-progress" className="gap-1.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 inline-flex h-2 w-2 animate-ping rounded-full bg-warning opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
          </span>
          {translate(lang, "public.live_badge")}
        </Badge>
      );
    case "completed":
      return (
        <Badge tone="status-completed">
          {translate(lang, "public.completed_badge")}
        </Badge>
      );
    case "registration_open":
      return (
        <Badge tone="status-registration">
          {translate(lang, "public.upcoming_badge")}
        </Badge>
      );
    default:
      return (
        <Badge tone="status-draft">
          {translate(lang, "public.draft_badge")}
        </Badge>
      );
  }
}

export function TournamentHeaderCard({ tournament, lang, showFee }: Props) {
  const formatLabel = translate(lang, TOURNAMENT_FORMAT_KEY[tournament.format]);
  const dateLabel =
    tournament.date_end && tournament.date_end !== tournament.date_start
      ? formatDateRange(tournament.date_start, tournament.date_end, lang)
      : formatLongDateWithWeekday(tournament.date_start, lang);
  const time = formatTime(tournament.start_time);

  return (
    <section className="rounded-lg bg-[var(--bg-surface)] p-5 shadow-md sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {statusBadge(tournament.status, lang)}
        <Badge tone="format">{formatLabel}</Badge>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-black sm:text-3xl">
        {tournament.name}
      </h1>
      <p className="mt-2 text-sm text-secondary">
        {dateLabel}
        {time ? ` · ${time}` : ""}
      </p>
      {showFee && tournament.entry_fee > 0 ? (
        <p className="mt-1 text-sm text-secondary">
          {translate(lang, "public.entry_fee_label")}:{" "}
          <span className="font-semibold text-black">
            {tournament.entry_fee} ₽
          </span>
        </p>
      ) : null}
    </section>
  );
}
