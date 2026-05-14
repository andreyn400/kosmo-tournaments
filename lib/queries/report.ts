import { createClient } from "../supabase/server";
import { computeEarnings } from "../coach-earnings";
import { addDays } from "../calendar-range";
import { OPS_CLOSE_HOUR, OPS_OPEN_HOUR } from "../ops-constants";
import type { Coach, Court } from "../types";
import { listRentalBlocksForRange } from "./rentals";

export interface WeeklyReport {
  weekStartIso: string;
  weekEndIso: string;
  revenue: {
    rentals_rub: number;
    scheduler_rub: number;
    tournaments_estimated_rub: number;
    total_rub: number;
  };
  courtUtilization: Array<{
    court_id: string;
    court_number: number;
    booked_hours: number;
    available_hours: number;
    pct: number;
  }>;
  coachPayouts: Array<{
    coach_id: string;
    coach_name: string;
    coach_color: string;
    sessions: number;
    gross_revenue_rub: number;
    payout_rub: number;
  }>;
  topPrograms: Array<{
    program_id: string | null;
    program_name: string;
    program_type: string | null;
    sessions: number;
    revenue_rub: number;
  }>;
  sessionsByDay: Array<{
    date: string;
    rows: Array<{
      id: string;
      start_time: string;
      end_time: string;
      program_name: string | null;
      program_type: string | null;
      coach_names: string[];
      court_numbers: number[];
      attendees: number;
      revenue_rub: number;
    }>;
  }>;
}

interface NestedProgram {
  id: string;
  name: string | null;
  type: string | null;
}

interface NestedCoach {
  id: string;
  name: string;
  color: string;
  rate_type: Coach["rate_type"];
  flat_rate_rub: number;
  rate_court_percent: number;
  rate_coaching_percent: number;
}

interface NestedSessionCoachRow {
  coach: NestedCoach | NestedCoach[] | null;
}

interface SessionRow {
  id: string;
  program_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[] | null;
  attendee_count: number;
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
  status: string;
  program: NestedProgram | NestedProgram[] | null;
  session_coaches: NestedSessionCoachRow[];
}

interface RentalPaymentRow {
  amount_rub: number;
  payment_type: string;
}

interface TournamentRow {
  id: string;
  entry_fee: number;
}

interface RegistrationRow {
  tournament_id: string;
}

function flatten<T>(raw: T | T[] | null): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function hhmmToMinutes(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function durationHours(start: string, end: string): number {
  const diff = hhmmToMinutes(end) - hhmmToMinutes(start);
  return diff > 0 ? diff / 60 : 0;
}

export async function getWeeklyReport(
  weekStartIso: string,
): Promise<WeeklyReport> {
  const weekEndIso = addDays(weekStartIso, 6);
  const supabase = await createClient();

  const [sessionsRes, paymentsRes, tournamentsRes, courtsRes, rentalBlocks] =
    await Promise.all([
      supabase
        .from("schedule_sessions")
        .select(
          `id, program_id, date, start_time, end_time, court_ids,
           attendee_count, revenue_rub, court_revenue_rub, coaching_fee_rub, status,
           program:programs(id, name, type),
           session_coaches(coach:coaches(id, name, color, rate_type, flat_rate_rub, rate_court_percent, rate_coaching_percent))`,
        )
        .gte("date", weekStartIso)
        .lte("date", weekEndIso)
        .neq("status", "cancelled"),
      supabase
        .from("rental_payments")
        .select("amount_rub, payment_type")
        .gte("payment_date", weekStartIso)
        .lte("payment_date", weekEndIso),
      supabase
        .from("tournaments")
        .select("id, entry_fee")
        .gte("date_start", weekStartIso)
        .lte("date_start", weekEndIso),
      supabase
        .from("courts")
        .select("*")
        .eq("status", "active")
        .order("number", { ascending: true }),
      listRentalBlocksForRange(weekStartIso, weekEndIso),
    ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);
  if (tournamentsRes.error) throw new Error(tournamentsRes.error.message);
  if (courtsRes.error) throw new Error(courtsRes.error.message);

  const sessions = (sessionsRes.data ?? []) as unknown as SessionRow[];
  const payments = (paymentsRes.data ?? []) as RentalPaymentRow[];
  const tournaments = (tournamentsRes.data ?? []) as TournamentRow[];
  const courts = (courtsRes.data ?? []) as Court[];

  // ── Tournament fees: registrations × entry_fee ──────────────────────────
  let regRows: RegistrationRow[] = [];
  if (tournaments.length > 0) {
    const ids = tournaments.map((t) => t.id);
    const regRes = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .in("tournament_id", ids);
    if (regRes.error) throw new Error(regRes.error.message);
    regRows = (regRes.data ?? []) as RegistrationRow[];
  }
  const regCountByTournament = new Map<string, number>();
  for (const r of regRows) {
    regCountByTournament.set(
      r.tournament_id,
      (regCountByTournament.get(r.tournament_id) ?? 0) + 1,
    );
  }
  let tournaments_estimated_rub = 0;
  for (const t of tournaments) {
    const count = regCountByTournament.get(t.id) ?? 0;
    tournaments_estimated_rub += t.entry_fee * count;
  }

  // ── Rental revenue: sum payments (refunds subtracted) ───────────────────
  let rentals_rub = 0;
  for (const p of payments) {
    if (p.payment_type === "refund") {
      rentals_rub -= p.amount_rub;
    } else {
      rentals_rub += p.amount_rub;
    }
  }

  // ── Scheduler revenue: sum of session revenue_rub ───────────────────────
  let scheduler_rub = 0;
  for (const s of sessions) scheduler_rub += s.revenue_rub ?? 0;

  // ── Court utilization: hours booked per court ───────────────────────────
  const bookedByCourt = new Map<string, number>();
  const addBooking = (courtId: string, hours: number) => {
    bookedByCourt.set(courtId, (bookedByCourt.get(courtId) ?? 0) + hours);
  };
  for (const s of sessions) {
    const hours = durationHours(s.start_time, s.end_time);
    for (const cid of s.court_ids ?? []) addBooking(cid, hours);
  }
  for (const block of rentalBlocks) {
    const hours = durationHours(block.start_time, block.end_time);
    for (const cid of block.court_ids) addBooking(cid, hours);
  }

  const HOURS_PER_DAY = OPS_CLOSE_HOUR - OPS_OPEN_HOUR;
  const available_hours = HOURS_PER_DAY * 7;
  const courtUtilization = courts.map((c) => {
    const booked = bookedByCourt.get(c.id) ?? 0;
    return {
      court_id: c.id,
      court_number: c.number,
      booked_hours: Math.round(booked * 10) / 10,
      available_hours,
      pct: Math.min(100, Math.round((booked / available_hours) * 100)),
    };
  });

  // ── Coach payouts: per coach, accumulate sessions + revenue + payout ────
  type CoachAgg = {
    coach_id: string;
    coach_name: string;
    coach_color: string;
    sessions: number;
    gross_revenue_rub: number;
    payout_rub: number;
  };
  const coachAgg = new Map<string, CoachAgg>();

  for (const s of sessions) {
    const links = s.session_coaches ?? [];
    for (const link of links) {
      const coach = flatten(link.coach);
      if (!coach) continue;
      const cur = coachAgg.get(coach.id) ?? {
        coach_id: coach.id,
        coach_name: coach.name,
        coach_color: coach.color,
        sessions: 0,
        gross_revenue_rub: 0,
        payout_rub: 0,
      };
      cur.sessions += 1;
      cur.gross_revenue_rub += s.revenue_rub ?? 0;
      cur.payout_rub += computeEarnings(coach, {
        court_revenue_rub: s.court_revenue_rub ?? 0,
        coaching_fee_rub: s.coaching_fee_rub ?? 0,
      });
      coachAgg.set(coach.id, cur);
    }
  }
  const coachPayouts = Array.from(coachAgg.values()).sort(
    (a, b) => b.payout_rub - a.payout_rub,
  );

  // ── Top programs: group by program_id ───────────────────────────────────
  type ProgAgg = {
    program_id: string | null;
    program_name: string;
    program_type: string | null;
    sessions: number;
    revenue_rub: number;
  };
  const progAgg = new Map<string, ProgAgg>();
  for (const s of sessions) {
    const p = flatten(s.program);
    const key = p?.id ?? "_unknown";
    const cur = progAgg.get(key) ?? {
      program_id: p?.id ?? null,
      program_name: p?.name ?? "Без программы",
      program_type: p?.type ?? null,
      sessions: 0,
      revenue_rub: 0,
    };
    cur.sessions += 1;
    cur.revenue_rub += s.revenue_rub ?? 0;
    progAgg.set(key, cur);
  }
  const topPrograms = Array.from(progAgg.values()).sort(
    (a, b) => b.revenue_rub - a.revenue_rub,
  );

  // ── Sessions by day ─────────────────────────────────────────────────────
  const courtNumberById = new Map<string, number>();
  for (const c of courts) courtNumberById.set(c.id, c.number);

  const byDay = new Map<string, WeeklyReport["sessionsByDay"][number]["rows"]>();
  for (const s of sessions) {
    const p = flatten(s.program);
    const coachNames = (s.session_coaches ?? [])
      .map((link) => flatten(link.coach))
      .filter((c): c is NestedCoach => c !== null)
      .map((c) => c.name);
    const courtNumbers = (s.court_ids ?? [])
      .map((cid) => courtNumberById.get(cid))
      .filter((n): n is number => n != null)
      .sort((a, b) => a - b);
    const list = byDay.get(s.date) ?? [];
    list.push({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      program_name: p?.name ?? null,
      program_type: p?.type ?? null,
      coach_names: coachNames,
      court_numbers: courtNumbers,
      attendees: s.attendee_count ?? 0,
      revenue_rub: s.revenue_rub ?? 0,
    });
    byDay.set(s.date, list);
  }
  const sessionsByDay = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, rows]) => ({
      date,
      rows: rows.sort((a, b) => (a.start_time < b.start_time ? -1 : 1)),
    }));

  const total_rub = rentals_rub + scheduler_rub + tournaments_estimated_rub;

  return {
    weekStartIso,
    weekEndIso,
    revenue: {
      rentals_rub,
      scheduler_rub,
      tournaments_estimated_rub,
      total_rub,
    },
    courtUtilization,
    coachPayouts,
    topPrograms,
    sessionsByDay,
  };
}
