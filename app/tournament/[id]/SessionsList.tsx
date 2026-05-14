"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDateTime } from "@/lib/i18n/format";
import type { TranslationKey } from "@/lib/i18n";
import type { SessionStatus, TournamentSession } from "@/lib/types";

const SESSION_STATUS_KEY: Record<SessionStatus, TranslationKey> = {
  scheduled: "session.status.scheduled",
  in_progress: "session.status.in_progress",
  completed: "session.status.completed",
};

const SESSION_STATUS_TONE: Record<
  SessionStatus,
  "status-draft" | "status-progress" | "status-completed"
> = {
  scheduled: "status-draft",
  in_progress: "status-progress",
  completed: "status-completed",
};

export function SessionsList({
  tournamentId,
  sessions,
}: {
  tournamentId: string;
  sessions: TournamentSession[];
}) {
  const { t, lang } = useTranslation();

  if (sessions.length === 0) {
    return <p className="text-sm text-muted">{t("session.no_sessions")}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 px-3.5 py-3 bg-white"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-black font-medium">
                {t("session.label_n", { n: s.session_number })}
              </span>
              <Badge tone={SESSION_STATUS_TONE[s.status]}>
                {t(SESSION_STATUS_KEY[s.status])}
              </Badge>
            </div>
            <span className="text-xs text-muted tabular-nums">
              {formatDateTime(s.session_date, s.start_time, lang)}
            </span>
          </div>
          <SessionActionButton tournamentId={tournamentId} session={s} />
        </li>
      ))}
    </ul>
  );
}

function SessionActionButton({
  tournamentId,
  session,
}: {
  tournamentId: string;
  session: TournamentSession;
}) {
  const { t } = useTranslation();
  if (session.status === "scheduled") {
    return (
      <Link href={`/tournament/${tournamentId}/session/${session.id}/select`}>
        <Button size="sm">{t("session.action.start")}</Button>
      </Link>
    );
  }
  if (session.status === "in_progress") {
    return (
      <Link href={`/tournament/${tournamentId}/play`}>
        <Button size="sm">{t("session.action.play")}</Button>
      </Link>
    );
  }
  return (
    <span className="text-xs text-muted uppercase tracking-wider">
      {t("session.action.completed")}
    </span>
  );
}
