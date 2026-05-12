import type { Coach, ScheduleSession } from "./types";

type CoachRate = Pick<
  Coach,
  "rate_type" | "flat_rate_rub" | "rate_court_percent" | "rate_coaching_percent"
>;

type RevenueSplit = Pick<
  ScheduleSession,
  "court_revenue_rub" | "coaching_fee_rub"
>;

/**
 * Coach payout for a single session.
 * - flat: returns coach.flat_rate_rub regardless of session revenue
 * - percent: rate_court_percent% × court_revenue + rate_coaching_percent% × coaching_fee
 *
 * Result is rounded to the nearest ruble.
 */
export function computeEarnings(coach: CoachRate, session: RevenueSplit): number {
  if (coach.rate_type === "flat") return coach.flat_rate_rub;
  const fromCourt = (coach.rate_court_percent / 100) * session.court_revenue_rub;
  const fromCoaching =
    (coach.rate_coaching_percent / 100) * session.coaching_fee_rub;
  return Math.round(fromCourt + fromCoaching);
}

export interface MonthlyAggregate {
  sessions: number;
  revenue: number;
  courtRevenue: number;
  coachingFee: number;
  /** sum of computeEarnings across the sessions (computed by caller, since rate context needed) */
  payout: number;
}

export function emptyAggregate(): MonthlyAggregate {
  return {
    sessions: 0,
    revenue: 0,
    courtRevenue: 0,
    coachingFee: 0,
    payout: 0,
  };
}
