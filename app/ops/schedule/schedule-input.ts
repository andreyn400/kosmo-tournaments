import type {
  Program,
  ScheduleSessionStatus,
  SessionInput,
} from "@/lib/types";
import { isPeakWindow, minutesFromTime } from "@/lib/ops-constants";

export interface RawScheduleInput {
  program_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  coach_ids: string[];
  attendee_count: number;
  notes: string;
  status: ScheduleSessionStatus;
  /** If true, recompute revenue/court_revenue/coaching_fee from the program. */
  autoCalcRevenue: boolean;
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ValidatedSchedule =
  | { ok: true; value: SessionInput; coachIds: string[] }
  | { ok: false; error: string };

/**
 * Validate the popover's raw state into `{ SessionInput, coachIds[] }`. Mirrors
 * coach-page `validateSessionInput` but accepts an unscoped coach list and
 * tolerates zero-coach sessions (court rentals, open play, tournaments without
 * a designated coach). When `autoCalcRevenue=true` the revenue split is
 * derived from the program's peak/off-peak price × attendees and stored as a
 * snapshot — later price changes won't rewrite history.
 */
export function validateScheduleInput(
  raw: RawScheduleInput,
  program: Program | null,
): ValidatedSchedule {
  if (!DATE_RE.test(raw.date)) return { ok: false, error: "Неверная дата." };
  if (!TIME_RE.test(raw.start_time)) {
    return { ok: false, error: "Время начала: формат ЧЧ:ММ." };
  }
  if (!TIME_RE.test(raw.end_time)) {
    return { ok: false, error: "Время окончания: формат ЧЧ:ММ." };
  }
  if (minutesFromTime(raw.end_time) <= minutesFromTime(raw.start_time)) {
    return { ok: false, error: "Время окончания должно быть после начала." };
  }
  if (raw.court_ids.length === 0) {
    return { ok: false, error: "Выберите хотя бы один корт." };
  }
  if (
    !Number.isInteger(raw.attendee_count) ||
    raw.attendee_count < 0 ||
    raw.attendee_count > 64
  ) {
    return { ok: false, error: "Игроков — целое от 0 до 64." };
  }

  let revenue = 0;
  let courtRev = 0;
  let coachingFee = 0;
  const isPeak = isPeakWindow(raw.start_time, raw.end_time);

  if (raw.autoCalcRevenue) {
    if (!program) {
      return {
        ok: false,
        error: "Для авто-расчёта выручки выберите программу.",
      };
    }
    const pricePerPlayer = isPeak
      ? program.price_peak_rub
      : program.price_offpeak_rub;
    revenue = pricePerPlayer * raw.attendee_count;
    courtRev = pricePerPlayer * program.courts_needed;
    coachingFee = Math.max(0, revenue - courtRev);
  } else {
    for (const [v, label] of [
      [raw.revenue_rub, "Выручка"],
      [raw.court_revenue_rub, "Корт"],
      [raw.coaching_fee_rub, "Тренировка"],
    ] as const) {
      if (!Number.isInteger(v) || v < 0 || v > 10_000_000) {
        return { ok: false, error: `${label}: целое число ≥ 0.` };
      }
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
      source: "scheduler",
      status: raw.status,
    },
    coachIds: raw.coach_ids,
  };
}
