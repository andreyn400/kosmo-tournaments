import type {
  Program,
  SessionInput,
  ScheduleSessionStatus,
} from "@/lib/types";
import {
  isPeakWindow,
  minutesFromTime,
  timeFromMinutes,
} from "@/lib/program-groups";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export interface RawSessionInput {
  program_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  attendee_count: number;
  notes: string;
  status: ScheduleSessionStatus;
  /** If true, recompute revenue/court_revenue/coaching_fee from the program. */
  autoCalcRevenue: boolean;
  /** Manual overrides used when autoCalcRevenue=false. */
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateSessionInput(
  raw: RawSessionInput,
  program: Program | null,
): { ok: true; value: SessionInput } | { ok: false; error: FieldError } {
  if (!DATE_RE.test(raw.date))
    return { ok: false, error: fieldErr("error.invalid.date") };
  if (!TIME_RE.test(raw.start_time)) {
    return { ok: false, error: fieldErr("error.invalid.start_time_format") };
  }
  if (!TIME_RE.test(raw.end_time)) {
    return { ok: false, error: fieldErr("error.invalid.end_time_format") };
  }
  const startMin = minutesFromTime(raw.start_time);
  const endMin = minutesFromTime(raw.end_time);
  if (endMin <= startMin) {
    return {
      ok: false,
      error: fieldErr("error.invalid.end_time_after_start_alt"),
    };
  }
  if (
    !Number.isInteger(raw.attendee_count) ||
    raw.attendee_count < 0 ||
    raw.attendee_count > 64
  ) {
    return { ok: false, error: fieldErr("error.invalid.players_range_0_64") };
  }

  let revenue = 0;
  let courtRev = 0;
  let coachingFee = 0;
  const isPeak = isPeakWindow(raw.start_time, raw.end_time);

  if (raw.autoCalcRevenue) {
    if (!program) {
      return {
        ok: false,
        error: fieldErr("error.invalid.choose_program_for_revenue"),
      };
    }
    const pricePerPlayer = isPeak
      ? program.price_peak_rub
      : program.price_offpeak_rub;
    revenue = pricePerPlayer * raw.attendee_count;
    courtRev = pricePerPlayer * program.courts_needed;
    coachingFee = Math.max(0, revenue - courtRev);
  } else {
    if (
      !Number.isInteger(raw.revenue_rub) ||
      raw.revenue_rub < 0 ||
      raw.revenue_rub > 10_000_000
    ) {
      return {
        ok: false,
        error: fieldErr("error.invalid.revenue_non_negative_int"),
      };
    }
    if (
      !Number.isInteger(raw.court_revenue_rub) ||
      raw.court_revenue_rub < 0 ||
      raw.court_revenue_rub > 10_000_000
    ) {
      return {
        ok: false,
        error: fieldErr("error.invalid.court_rev_non_negative_int"),
      };
    }
    if (
      !Number.isInteger(raw.coaching_fee_rub) ||
      raw.coaching_fee_rub < 0 ||
      raw.coaching_fee_rub > 10_000_000
    ) {
      return {
        ok: false,
        error: fieldErr("error.invalid.coaching_fee_non_negative_int"),
      };
    }
    revenue = raw.revenue_rub;
    courtRev = raw.court_revenue_rub;
    coachingFee = raw.coaching_fee_rub;
  }

  return {
    ok: true,
    value: {
      program_id: raw.program_id,
      date: raw.date,
      start_time: raw.start_time,
      end_time: raw.end_time,
      court_ids: raw.court_ids,
      attendee_count: raw.attendee_count,
      revenue_rub: revenue,
      court_revenue_rub: courtRev,
      coaching_fee_rub: coachingFee,
      is_peak: isPeak,
      notes: raw.notes.trim() || null,
      source: "manual",
      status: raw.status,
    },
  };
}

/** Helper to compute an end time from a start time + duration in minutes. */
export function endFromStart(start: string, durationMinutes: number): string {
  return timeFromMinutes(minutesFromTime(start) + durationMinutes);
}
