import { createClient } from "../supabase/server";
import type {
  ScheduleSession,
  ScheduleSessionWithMeta,
  SessionInput,
} from "../types";
import { monthRange } from "./coaches";

interface NestedProgram {
  name: string | null;
  type: string | null;
}

interface NestedSessionCoach {
  coach_id: string;
}

interface SessionRow extends ScheduleSession {
  program: NestedProgram | NestedProgram[] | null;
  session_coaches: NestedSessionCoach[];
}

function flattenProgram(
  raw: NestedProgram | NestedProgram[] | null,
): { name: string | null; type: string | null } {
  if (!raw) return { name: null, type: null };
  if (Array.isArray(raw)) return raw[0] ?? { name: null, type: null };
  return raw;
}

/** Sessions for a single coach in a given YYYY-MM month. */
export async function listSessionsForCoach(
  coachId: string,
  monthStr: string,
): Promise<ScheduleSessionWithMeta[]> {
  const { firstDay, nextMonthFirstDay } = monthRange(monthStr);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_sessions")
    .select(
      `*,
       program:programs(name, type),
       session_coaches!inner(coach_id)`,
    )
    .eq("session_coaches.coach_id", coachId)
    .gte("date", firstDay)
    .lt("date", nextMonthFirstDay)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as SessionRow[]).map((row) => {
    const p = flattenProgram(row.program);
    return {
      id: row.id,
      program_id: row.program_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      court_ids: row.court_ids ?? [],
      attendee_count: row.attendee_count,
      revenue_rub: row.revenue_rub,
      court_revenue_rub: row.court_revenue_rub,
      coaching_fee_rub: row.coaching_fee_rub,
      is_peak: row.is_peak,
      notes: row.notes,
      source: row.source,
      status: row.status,
      created_at: row.created_at,
      program_name: p.name,
      program_type: p.type,
    };
  });
}

/** Insert a schedule_session AND link the given coach via session_coaches. */
export async function createSessionWithCoach(
  input: SessionInput,
  coachId: string,
): Promise<string> {
  const supabase = await createClient();
  const insertRes = await supabase
    .from("schedule_sessions")
    .insert(input)
    .select("id")
    .single();
  if (insertRes.error) throw new Error(insertRes.error.message);
  const sessionId = insertRes.data.id as string;

  const linkRes = await supabase
    .from("session_coaches")
    .insert({ session_id: sessionId, coach_id: coachId });
  if (linkRes.error) {
    // Clean up orphan session so the operator doesn't end up with a session
    // that's missing its coach link.
    await supabase.from("schedule_sessions").delete().eq("id", sessionId);
    throw new Error(linkRes.error.message);
  }
  return sessionId;
}

export async function updateSession(
  id: string,
  input: SessionInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_sessions")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
