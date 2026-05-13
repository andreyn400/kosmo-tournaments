import { createClient } from "../supabase/server";
import type {
  ScheduleSession,
  ScheduleSessionForGrid,
  SessionCoachChip,
} from "../types";

interface NestedProgram {
  name: string | null;
  type: string | null;
}

interface NestedCoach {
  id: string;
  name: string;
  color: string;
}

interface NestedSessionCoachRow {
  coach: NestedCoach | NestedCoach[] | null;
}

interface SessionRow extends ScheduleSession {
  program: NestedProgram | NestedProgram[] | null;
  session_coaches: NestedSessionCoachRow[];
}

function flattenProgram(
  raw: NestedProgram | NestedProgram[] | null,
): { name: string | null; type: string | null } {
  if (!raw) return { name: null, type: null };
  if (Array.isArray(raw)) return raw[0] ?? { name: null, type: null };
  return raw;
}

function flattenCoach(
  raw: NestedCoach | NestedCoach[] | null,
): NestedCoach | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

/**
 * All sessions whose date falls within [fromIso, toIsoInclusive]. Returned as
 * the scheduler-grid shape: program name + type joined for color/labelling,
 * coach chips joined for the dot strip. One batched query — the nested
 * Supabase select pulls programs and session_coaches→coaches in the same trip.
 *
 * `fromIso` and `toIsoInclusive` are YYYY-MM-DD; both ends inclusive. Pass the
 * same date twice for a single-day fetch.
 */
export async function listSessionsForRange(
  fromIso: string,
  toIsoInclusive: string,
): Promise<ScheduleSessionForGrid[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_sessions")
    .select(
      `*,
       program:programs(name, type),
       session_coaches(coach:coaches(id, name, color))`,
    )
    .gte("date", fromIso)
    .lte("date", toIsoInclusive)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as SessionRow[]).map((row) => {
    const p = flattenProgram(row.program);
    const chips: SessionCoachChip[] = (row.session_coaches ?? [])
      .map((sc) => flattenCoach(sc.coach))
      .filter((c): c is NestedCoach => c !== null)
      .map((c) => ({ id: c.id, name: c.name, color: c.color }));

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
      coach_chips: chips,
    };
  });
}

/** Single session with the same grid-shape fields (for the edit popover). */
export async function getSessionForGrid(
  id: string,
): Promise<ScheduleSessionForGrid | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_sessions")
    .select(
      `*,
       program:programs(name, type),
       session_coaches(coach:coaches(id, name, color))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as SessionRow;
  const p = flattenProgram(row.program);
  const chips: SessionCoachChip[] = (row.session_coaches ?? [])
    .map((sc) => flattenCoach(sc.coach))
    .filter((c): c is NestedCoach => c !== null)
    .map((c) => ({ id: c.id, name: c.name, color: c.color }));

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
    coach_chips: chips,
  };
}

