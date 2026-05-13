import type {
  Court,
  RentalContractStatus,
  RentalPaymentScheduleType,
  RentalSlot,
} from "@/lib/types";
import { DAY_LABELS_SHORT } from "../coaches/format";

/**
 * Format a list of weekly slots as a compact schedule summary.
 * Example: "Вт 19:00–21:00 · Чт 18:00–20:00 · К1+К2".
 * Slots are grouped by (day_of_week, start_time, end_time); the same time on
 * multiple days collapses into one entry like "Пн, Ср 19:00–21:00".
 */
export function formatScheduleSummary(slots: RentalSlot[]): string {
  if (slots.length === 0) return "—";

  // Group by (start, end) — same time across multiple days collapses.
  const byTime = new Map<string, { days: Set<number>; sample: RentalSlot }>();
  for (const s of slots) {
    const key = `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`;
    const cur = byTime.get(key);
    if (cur) {
      cur.days.add(s.day_of_week);
    } else {
      byTime.set(key, { days: new Set([s.day_of_week]), sample: s });
    }
  }

  const parts: string[] = [];
  for (const { days, sample } of byTime.values()) {
    const sortedDays = [...days].sort((a, b) => a - b);
    const dayLabel = sortedDays.map((d) => DAY_LABELS_SHORT[d]).join(", ");
    const timeLabel = `${sample.start_time.slice(0, 5)}–${sample.end_time.slice(0, 5)}`;
    parts.push(`${dayLabel} ${timeLabel}`);
  }
  return parts.join(" · ");
}

/**
 * Distinct courts used by any slot on a contract. Returns "К1, К2" by court
 * number — falls back to "?" for courts no longer in the active list.
 */
export function formatCourtsList(
  slots: RentalSlot[],
  courts: Court[],
): string {
  const idToCourt = new Map(courts.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const sortable: Court[] = [];
  for (const s of slots) {
    for (const cid of s.court_ids) {
      if (seen.has(cid)) continue;
      seen.add(cid);
      const c = idToCourt.get(cid);
      if (c) sortable.push(c);
    }
  }
  if (sortable.length === 0) return "—";
  sortable.sort((a, b) => a.number - b.number);
  return sortable.map((c) => c.name).join(", ");
}

export const STATUS_LABELS: Record<RentalContractStatus, string> = {
  draft: "Черновик",
  active: "Активен",
  paused: "Приостановлен",
  ended: "Завершён",
  cancelled: "Отменён",
};

export const PAYMENT_SCHEDULE_LABELS: Record<RentalPaymentScheduleType, string> =
  {
    one_time: "Единовременно",
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    custom: "По договорённости",
  };

export function formatContractPeriod(
  startIso: string,
  endIso: string,
): string {
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  const sStr = `${String(s.getDate()).padStart(2, "0")}.${String(s.getMonth() + 1).padStart(2, "0")}.${s.getFullYear()}`;
  const eStr = `${String(e.getDate()).padStart(2, "0")}.${String(e.getMonth() + 1).padStart(2, "0")}.${e.getFullYear()}`;
  return `${sStr} – ${eStr}`;
}

/** Months remaining (rounded). Negative means contract end has passed. */
export function monthsBetween(startIso: string, endIso: string): number {
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  return (
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth()) +
    (e.getDate() >= s.getDate() ? 0 : -1) +
    1
  );
}

export const PAYMENT_TYPE_LABELS = {
  payment: "Платёж",
  deposit: "Депозит",
  penalty: "Штраф",
  refund: "Возврат",
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
} as const;
