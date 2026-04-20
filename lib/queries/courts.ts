import { createClient } from "../supabase/server";
import { minutesFromHHMM } from "../calendar-layout";
import type { Court, CourtStatus, CourtSurface } from "../types";

export async function listCourts(): Promise<Court[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .order("number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Court[];
}

export async function listActiveCourts(): Promise<Court[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("status", "active")
    .order("number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Court[];
}

export async function listCourtsByIds(ids: string[]): Promise<Court[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .in("id", ids)
    .order("number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Court[];
}

export async function getCourt(id: string): Promise<Court | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Court | null) ?? null;
}

export async function createCourt(input: {
  name: string;
  number: number;
  surface: CourtSurface;
  status: CourtStatus;
  notes: string | null;
}): Promise<Court> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Court;
}

export async function updateCourt(
  id: string,
  input: {
    name: string;
    number: number;
    surface: CourtSurface;
    status: CourtStatus;
    notes: string | null;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("courts").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCourt(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("courts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countTournamentsUsingCourt(
  courtId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .contains("court_ids", [courtId]);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export interface CourtConflict {
  tournamentId: string;
  tournamentName: string;
  courtNumbers: number[];
}

type ConflictRow = {
  id: string;
  name: string;
  type: "one_day" | "league_season";
  court_ids: string[] | null;
  start_time: string | null;
  duration_hours: number | null;
  date_start: string;
  status: string;
  tournament_sessions:
    | Array<{
        session_date: string;
        start_time: string | null;
        status: string;
      }>
    | null;
};

export async function checkCourtConflicts(input: {
  courtIds: string[];
  date: string;
  startTime: string | null;
  durationHours: number;
  excludeTournamentId?: string;
}): Promise<CourtConflict[]> {
  const { courtIds, date, startTime, durationHours, excludeTournamentId } =
    input;
  if (!startTime || courtIds.length === 0) return [];

  const supabase = await createClient();

  let query = supabase
    .from("tournaments")
    .select(
      `id, name, type, court_ids, start_time, duration_hours, date_start, status,
       tournament_sessions ( session_date, start_time, status )`,
    )
    .in("status", ["registration_open", "in_progress"])
    .overlaps("court_ids", courtIds);
  if (excludeTournamentId) query = query.neq("id", excludeTournamentId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const courtsRes = await supabase
    .from("courts")
    .select("id, number")
    .in("id", courtIds);
  if (courtsRes.error) throw new Error(courtsRes.error.message);
  const courtNumById = new Map<string, number>(
    (courtsRes.data ?? []).map((c) => [
      c.id as string,
      c.number as number,
    ]),
  );

  const startMin = minutesFromHHMM(startTime);
  const endMin = startMin + Math.round(durationHours * 60);

  const conflicts: CourtConflict[] = [];
  const seen = new Set<string>();

  for (const row of (data ?? []) as ConflictRow[]) {
    if (seen.has(row.id)) continue;

    const overlapping = (row.court_ids ?? []).filter((id) =>
      courtIds.includes(id),
    );
    if (overlapping.length === 0) continue;

    const duration = row.duration_hours ?? 2;
    const candidates: Array<{ startTime: string | null }> = [];

    const sessions = (row.tournament_sessions ?? []).filter(
      (s) => s.session_date === date && s.status !== "completed",
    );
    for (const s of sessions) {
      candidates.push({ startTime: s.start_time ?? row.start_time });
    }
    if (row.date_start === date && sessions.length === 0) {
      candidates.push({ startTime: row.start_time });
    }

    let overlaps = false;
    for (const c of candidates) {
      if (!c.startTime) continue;
      const sMin = minutesFromHHMM(c.startTime);
      const eMin = sMin + Math.round(duration * 60);
      if (startMin < eMin && endMin > sMin) {
        overlaps = true;
        break;
      }
    }

    if (overlaps) {
      seen.add(row.id);
      const nums: number[] = [];
      for (const id of overlapping) {
        const n = courtNumById.get(id);
        if (typeof n === "number") nums.push(n);
      }
      nums.sort((a, b) => a - b);
      conflicts.push({
        tournamentId: row.id,
        tournamentName: row.name,
        courtNumbers: nums,
      });
    }
  }

  return conflicts;
}
