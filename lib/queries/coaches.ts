import { createClient } from "../supabase/server";
import type {
  AvailabilityWindow,
  Coach,
  CoachAvailability,
  CoachInput,
} from "../types";
import { computeEarnings } from "../coach-earnings";

export async function listCoaches(
  opts: { activeOnly?: boolean } = {},
): Promise<Coach[]> {
  const supabase = await createClient();
  let q = supabase
    .from("coaches")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });
  if (opts.activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Coach[];
}

export async function getCoach(id: string): Promise<Coach | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Coach | null) ?? null;
}

export async function createCoach(input: CoachInput): Promise<Coach> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Coach;
}

export async function updateCoach(
  id: string,
  input: CoachInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCoach(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listAvailability(
  coachId: string,
): Promise<CoachAvailability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_availability")
    .select("*")
    .eq("coach_id", coachId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CoachAvailability[];
}

export async function replaceAvailability(
  coachId: string,
  windows: AvailabilityWindow[],
): Promise<void> {
  const supabase = await createClient();
  const del = await supabase
    .from("coach_availability")
    .delete()
    .eq("coach_id", coachId);
  if (del.error) throw new Error(del.error.message);
  if (windows.length === 0) return;
  const rows = windows.map((w) => ({
    coach_id: coachId,
    day_of_week: w.day_of_week,
    start_time: w.start_time,
    end_time: w.end_time,
  }));
  const ins = await supabase.from("coach_availability").insert(rows);
  if (ins.error) throw new Error(ins.error.message);
}

export interface CoachWithMonthlyStats extends Coach {
  monthSessions: number;
  monthRevenue: number;
  monthEarnings: number;
}

interface SessionAggRow {
  date: string;
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
  status: string;
  session_coaches: { coach_id: string }[];
}

/**
 * Fetch all coaches and aggregate this-month stats per coach in a single
 * batched query. Cancelled sessions are excluded from totals.
 */
export async function listCoachesWithMonthlyStats(
  monthStr: string,
): Promise<CoachWithMonthlyStats[]> {
  const { firstDay, nextMonthFirstDay } = monthRange(monthStr);
  const supabase = await createClient();

  const coachesRes = await supabase
    .from("coaches")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });
  if (coachesRes.error) throw new Error(coachesRes.error.message);
  const coaches = (coachesRes.data ?? []) as Coach[];

  const sessRes = await supabase
    .from("schedule_sessions")
    .select(
      `date, revenue_rub, court_revenue_rub, coaching_fee_rub, status,
       session_coaches!inner(coach_id)`,
    )
    .gte("date", firstDay)
    .lt("date", nextMonthFirstDay)
    .neq("status", "cancelled");
  if (sessRes.error) throw new Error(sessRes.error.message);

  const statsByCoach = new Map<
    string,
    { sessions: number; revenue: number; court: number; fee: number }
  >();
  for (const row of (sessRes.data ?? []) as SessionAggRow[]) {
    for (const link of row.session_coaches ?? []) {
      const cur = statsByCoach.get(link.coach_id) ?? {
        sessions: 0,
        revenue: 0,
        court: 0,
        fee: 0,
      };
      cur.sessions += 1;
      cur.revenue += row.revenue_rub ?? 0;
      cur.court += row.court_revenue_rub ?? 0;
      cur.fee += row.coaching_fee_rub ?? 0;
      statsByCoach.set(link.coach_id, cur);
    }
  }

  return coaches.map((c) => {
    const s = statsByCoach.get(c.id);
    let earnings = 0;
    if (s) {
      if (c.rate_type === "flat") {
        earnings = c.flat_rate_rub * s.sessions;
      } else {
        earnings = computeEarnings(c, {
          court_revenue_rub: s.court,
          coaching_fee_rub: s.fee,
        });
      }
    }
    return {
      ...c,
      monthSessions: s?.sessions ?? 0,
      monthRevenue: s?.revenue ?? 0,
      monthEarnings: earnings,
    };
  });
}

export function monthRange(monthStr: string): {
  firstDay: string;
  nextMonthFirstDay: string;
} {
  const [yStr, mStr] = monthStr.split("-");
  const year = Number.parseInt(yStr, 10);
  const mon = Number.parseInt(mStr, 10);
  const firstDay = `${year}-${String(mon).padStart(2, "0")}-01`;
  const nextMonthFirstDay =
    mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  return { firstDay, nextMonthFirstDay };
}
