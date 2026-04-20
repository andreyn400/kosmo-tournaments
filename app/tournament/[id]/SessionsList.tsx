import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTimeRu } from "@/lib/format-date";
import type { SessionStatus, TournamentSession } from "@/lib/types";

const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: "Запланирована",
  in_progress: "Идёт",
  completed: "Завершена",
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
  if (sessions.length === 0) {
    return <p className="text-sm text-muted">Сессии не созданы.</p>;
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
                Сессия {s.session_number}
              </span>
              <Badge tone={SESSION_STATUS_TONE[s.status]}>
                {SESSION_STATUS_LABEL[s.status]}
              </Badge>
            </div>
            <span className="text-xs text-muted tabular-nums">
              {formatDateTimeRu(s.session_date, s.start_time)}
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
  if (session.status === "scheduled") {
    return (
      <Link
        href={`/tournament/${tournamentId}/session/${session.id}/select`}
      >
        <Button size="sm">Запустить</Button>
      </Link>
    );
  }
  if (session.status === "in_progress") {
    return (
      <Link href={`/tournament/${tournamentId}/play`}>
        <Button size="sm">Играть</Button>
      </Link>
    );
  }
  return (
    <span className="text-xs text-muted uppercase tracking-wider">
      Завершена
    </span>
  );
}
