import type { RentalPaymentScheduleType } from "./types";

/**
 * Generate the expected payment schedule for a contract. Pro-rated by days so
 * a mid-month start doesn't charge a full month; the last entry's amount is
 * adjusted to make the sum exact.
 *
 * `one_time`  → one entry on start_date, full amount.
 * `monthly`   → one entry per calendar month overlap, due on the 1st (or
 *               start_date for the first entry).
 * `quarterly` → one entry per calendar quarter overlap.
 * `custom`    → empty (operator builds manually).
 *
 * Returns the entries with NO contract_id — caller stamps it before insert.
 */
export interface GeneratedScheduleEntry {
  period_label: string;
  amount_due_rub: number;
  due_date: string;
  notes: string | null;
}

const MONTH_NAMES_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function parseIsoLocal(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

export function generateSchedule(params: {
  start_date: string;
  end_date: string;
  total_value_rub: number;
  payment_schedule_type: RentalPaymentScheduleType;
}): GeneratedScheduleEntry[] {
  const { start_date, end_date, total_value_rub, payment_schedule_type } = params;

  if (payment_schedule_type === "custom") return [];
  if (total_value_rub <= 0) return [];

  if (payment_schedule_type === "one_time") {
    return [
      {
        period_label: "Полная оплата",
        amount_due_rub: total_value_rub,
        due_date: start_date,
        notes: null,
      },
    ];
  }

  const monthsPerEntry = payment_schedule_type === "monthly" ? 1 : 3;
  const start = parseIsoLocal(start_date);
  const end = parseIsoLocal(end_date);
  const totalDays = daysBetween(start, end) + 1;
  if (totalDays <= 0) return [];

  // Build period boundaries, anchored to the 1st of the month (or first of
  // the quarter). Intersect each period with the contract window.
  const periods: Array<{ start: Date; end: Date }> = [];
  let cursorMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursorMonth <= end) {
    const nextCursor = addMonths(cursorMonth, monthsPerEntry);
    const periodEnd = new Date(nextCursor.getTime() - 24 * 60 * 60 * 1000);
    const clampedStart = cursorMonth < start ? start : cursorMonth;
    const clampedEnd = periodEnd > end ? end : periodEnd;
    if (clampedEnd >= clampedStart) {
      periods.push({ start: clampedStart, end: clampedEnd });
    }
    cursorMonth = nextCursor;
  }

  if (periods.length === 0) return [];

  // Pro-rate by days. Last entry absorbs the rounding remainder so the
  // schedule sum equals total_value_rub exactly.
  let assigned = 0;
  return periods.map((p, i) => {
    const daysInPeriod = daysBetween(p.start, p.end) + 1;
    let amount: number;
    if (i === periods.length - 1) {
      amount = total_value_rub - assigned;
    } else {
      amount = Math.round(
        (total_value_rub * daysInPeriod) / totalDays,
      );
      assigned += amount;
    }

    let label: string;
    if (payment_schedule_type === "monthly") {
      label = `${MONTH_NAMES_RU[p.start.getMonth()]} ${p.start.getFullYear()}`;
    } else {
      const q = Math.floor(p.start.getMonth() / 3) + 1;
      label = `Q${q} ${p.start.getFullYear()}`;
    }

    return {
      period_label: label,
      amount_due_rub: amount,
      due_date: toIso(p.start),
      notes: null,
    };
  });
}
