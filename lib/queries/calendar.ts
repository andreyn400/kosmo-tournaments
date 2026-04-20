import { createClient } from "../supabase/server";
import type {
  SessionStatus,
  TournamentFormat,
  TournamentStatus,
  TournamentType,
} from "../types";

export async function listEventDates(): Promise<string[]> {
  const supabase = await createClient();
  const [tRes, sRes] = await Promise.all([
    supabase.from("tournaments").select("date_start,date_end"),
    supabase.from("tournament_sessions").select("session_date"),
  ]);
  if (tRes.error) throw new Error(tRes.error.message);
  if (sRes.error) throw new Error(sRes.error.message);

  const set = new Set<string>();
  for (const row of tRes.data ?? []) {
    const start = row.date_start as string | null;
    const end = row.date_end as string | null;
    if (start) set.add(start);
    if (end && end !== start) set.add(end);
  }
  for (const row of sRes.data ?? []) {
    const d = row.session_date as string | null;
    if (d) set.add(d);
  }
  return Array.from(set);
}

export interface CalendarEvent {
  key: string;
  kind: "session" | "tournament_pending";
  date: string;
  startTime: string | null;
  durationHours: number;
  tournamentId: string;
  tournamentName: string;
  tournamentType: TournamentType;
  tournamentStatus: TournamentStatus;
  format: TournamentFormat;
  courtIds: string[];
  sessionId?: string;
  sessionNumber?: number;
  sessionStatus?: SessionStatus;
}

type SessionJoinedRow = {
  id: string;
  tournament_id: string;
  session_date: string;
  session_number: number;
  status: SessionStatus;
  start_time: string | null;
  tournaments: {
    name: string;
    type: TournamentType;
    status: TournamentStatus;
    format: TournamentFormat;
    duration_hours: number;
    court_ids: string[] | null;
    start_time: string | null;
  } | null;
};

type PendingTournamentRow = {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  format: TournamentFormat;
  date_start: string;
  start_time: string | null;
  duration_hours: number;
  court_ids: string[] | null;
  tournament_sessions: Array<{ id: string }>;
};

export async function listCalendarEventsInRange(
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [sessionsRes, pendingRes] = await Promise.all([
    supabase
      .from("tournament_sessions")
      .select(
        `id, tournament_id, session_date, session_number, status, start_time,
         tournaments ( name, type, status, format, duration_hours, court_ids, start_time )`,
      )
      .gte("session_date", startIso)
      .lte("session_date", endIso),
    supabase
      .from("tournaments")
      .select(
        `id, name, type, status, format, date_start, start_time, duration_hours, court_ids,
         tournament_sessions ( id )`,
      )
      .gte("date_start", startIso)
      .lte("date_start", endIso),
  ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (pendingRes.error) throw new Error(pendingRes.error.message);

  const events: CalendarEvent[] = [];

  const sessionRows = (sessionsRes.data ?? []) as unknown as SessionJoinedRow[];
  for (const s of sessionRows) {
    const t = s.tournaments;
    if (!t) continue;
    events.push({
      key: `s:${s.id}`,
      kind: "session",
      date: s.session_date,
      startTime: s.start_time ?? t.start_time ?? null,
      durationHours: t.duration_hours ?? 2,
      tournamentId: s.tournament_id,
      tournamentName: t.name,
      tournamentType: t.type,
      tournamentStatus: t.status,
      format: t.format,
      courtIds: t.court_ids ?? [],
      sessionId: s.id,
      sessionNumber: s.session_number,
      sessionStatus: s.status,
    });
  }

  const pendingRows =
    (pendingRes.data ?? []) as unknown as PendingTournamentRow[];
  for (const t of pendingRows) {
    if (t.tournament_sessions && t.tournament_sessions.length > 0) continue;
    events.push({
      key: `t:${t.id}`,
      kind: "tournament_pending",
      date: t.date_start,
      startTime: t.start_time ?? null,
      durationHours: t.duration_hours ?? 2,
      tournamentId: t.id,
      tournamentName: t.name,
      tournamentType: t.type,
      tournamentStatus: t.status,
      format: t.format,
      courtIds: t.court_ids ?? [],
    });
  }

  return events;
}
