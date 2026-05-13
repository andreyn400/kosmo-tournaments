import { createClient } from "../supabase/server";
import type {
  SessionStatus,
  TournamentFormat,
  TournamentStatus,
  TournamentType,
} from "../types";
import { listRentalBlocksForRange } from "./rentals";
import { listSessionsForRange } from "./schedule";

export type EventKind =
  | "tournament"
  | "league_session"
  | "rental"
  | "schedule_session";

interface BaseCalendarEvent {
  key: string;
  date: string;
  startTime: string | null;
  durationHours: number;
  courtIds: string[];
}

export interface TournamentCalendarEvent extends BaseCalendarEvent {
  kind: "tournament";
  tournamentId: string;
  tournamentName: string;
  tournamentType: TournamentType;
  tournamentStatus: TournamentStatus;
  format: TournamentFormat;
}

export interface LeagueSessionCalendarEvent extends BaseCalendarEvent {
  kind: "league_session";
  tournamentId: string;
  tournamentName: string;
  tournamentType: TournamentType;
  tournamentStatus: TournamentStatus;
  format: TournamentFormat;
  sessionId: string;
  sessionNumber: number;
  sessionStatus: SessionStatus;
}

export interface RentalCalendarEvent extends BaseCalendarEvent {
  kind: "rental";
  contractId: string;
  slotId: string;
  clientName: string;
  contractNumber: string | null;
  slotNotes: string | null;
}

export interface ScheduleSessionCalendarEvent extends BaseCalendarEvent {
  kind: "schedule_session";
  sessionId: string;
  programName: string | null;
  programType: string | null;
  coachNames: string[];
}

export type CalendarEvent =
  | TournamentCalendarEvent
  | LeagueSessionCalendarEvent
  | RentalCalendarEvent
  | ScheduleSessionCalendarEvent;

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

function hhmmToMinutes(t: string | null): number {
  if (!t) return 0;
  const parts = t.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

function durationHoursBetween(
  start: string | null,
  end: string | null,
): number {
  if (!start || !end) return 1;
  const diff = hhmmToMinutes(end) - hhmmToMinutes(start);
  return diff > 0 ? diff / 60 : 1;
}

export async function listCalendarEventsInRange(
  startIso: string,
  endIso: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [sessionsRes, pendingRes, rentalBlocks, scheduleSessions] =
    await Promise.all([
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
      listRentalBlocksForRange(startIso, endIso),
      listSessionsForRange(startIso, endIso),
    ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (pendingRes.error) throw new Error(pendingRes.error.message);

  const events: CalendarEvent[] = [];

  const sessionRows = (sessionsRes.data ?? []) as unknown as SessionJoinedRow[];
  for (const s of sessionRows) {
    const t = s.tournaments;
    if (!t) continue;
    events.push({
      key: `ls:${s.id}`,
      kind: "league_session",
      date: s.session_date,
      startTime: s.start_time ?? t.start_time ?? null,
      durationHours: t.duration_hours ?? 2,
      courtIds: t.court_ids ?? [],
      tournamentId: s.tournament_id,
      tournamentName: t.name,
      tournamentType: t.type,
      tournamentStatus: t.status,
      format: t.format,
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
      kind: "tournament",
      date: t.date_start,
      startTime: t.start_time ?? null,
      durationHours: t.duration_hours ?? 2,
      courtIds: t.court_ids ?? [],
      tournamentId: t.id,
      tournamentName: t.name,
      tournamentType: t.type,
      tournamentStatus: t.status,
      format: t.format,
    });
  }

  for (const block of rentalBlocks) {
    events.push({
      key: `r:${block.id}`,
      kind: "rental",
      date: block.date,
      startTime: block.start_time,
      durationHours: durationHoursBetween(block.start_time, block.end_time),
      courtIds: block.court_ids,
      contractId: block.contract_id,
      slotId: block.slot_id,
      clientName: block.client_name,
      contractNumber: block.contract_number,
      slotNotes: block.slot_notes,
    });
  }

  for (const session of scheduleSessions) {
    events.push({
      key: `ss:${session.id}`,
      kind: "schedule_session",
      date: session.date,
      startTime: session.start_time,
      durationHours: durationHoursBetween(session.start_time, session.end_time),
      courtIds: session.court_ids ?? [],
      sessionId: session.id,
      programName: session.program_name,
      programType: session.program_type,
      coachNames: session.coach_chips.map((c) => c.name),
    });
  }

  return events;
}

/**
 * Per-date map of which event kinds occur. Used by the sidebar mini calendar
 * to render up to four colored dots per cell. Kinds in canonical order.
 */
export async function listEventKindsByDate(
  fromIso: string,
  toIso: string,
): Promise<Record<string, EventKind[]>> {
  const supabase = await createClient();

  const [tRes, sRes, ssRes, rentalBlocks] = await Promise.all([
    supabase
      .from("tournaments")
      .select("date_start, date_end")
      .gte("date_start", fromIso)
      .lte("date_start", toIso),
    supabase
      .from("tournament_sessions")
      .select("session_date")
      .gte("session_date", fromIso)
      .lte("session_date", toIso),
    supabase
      .from("schedule_sessions")
      .select("date")
      .gte("date", fromIso)
      .lte("date", toIso),
    listRentalBlocksForRange(fromIso, toIso),
  ]);
  if (tRes.error) throw new Error(tRes.error.message);
  if (sRes.error) throw new Error(sRes.error.message);
  if (ssRes.error) throw new Error(ssRes.error.message);

  const map = new Map<string, Set<EventKind>>();
  const mark = (date: string | null, kind: EventKind) => {
    if (!date) return;
    let set = map.get(date);
    if (!set) {
      set = new Set();
      map.set(date, set);
    }
    set.add(kind);
  };

  for (const row of tRes.data ?? []) {
    const start = row.date_start as string | null;
    const end = row.date_end as string | null;
    mark(start, "tournament");
    if (end && end !== start) mark(end, "tournament");
  }
  for (const row of sRes.data ?? []) {
    mark(row.session_date as string | null, "league_session");
  }
  for (const row of ssRes.data ?? []) {
    mark(row.date as string | null, "schedule_session");
  }
  for (const block of rentalBlocks) {
    mark(block.date, "rental");
  }

  const canonicalOrder: EventKind[] = [
    "tournament",
    "league_session",
    "rental",
    "schedule_session",
  ];
  const out: Record<string, EventKind[]> = {};
  for (const [date, set] of map.entries()) {
    out[date] = canonicalOrder.filter((k) => set.has(k));
  }
  return out;
}
