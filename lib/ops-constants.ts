/**
 * Scheduler-wide constants. Tweakable from one place; everything from the
 * day-grid row count to peak-row shading reads through this module.
 *
 * Hours are 0–23. The scheduler renders rows for every slot that *starts*
 * within [OPS_OPEN_HOUR:00, OPS_CLOSE_HOUR:00), so a CLOSE_HOUR of 23 with a
 * SLOT_MINUTES of 30 yields the last row at 22:30 — 23:00 is the close-of-day
 * boundary, not a bookable slot.
 */
export const OPS_OPEN_HOUR = 7;
export const OPS_CLOSE_HOUR = 23;
export const OPS_SLOT_MINUTES = 30;

export const SLOTS_PER_DAY =
  ((OPS_CLOSE_HOUR - OPS_OPEN_HOUR) * 60) / OPS_SLOT_MINUTES;

/** Re-export so the scheduler can import everything from one module. */
export {
  PEAK_START_HOUR,
  PEAK_END_HOUR,
  PEAK_LABEL,
  isPeakWindow,
  minutesFromTime,
  timeFromMinutes,
} from "./program-groups";

/** Slot index (0-based) for a HH:MM string, clamped to [0, SLOTS_PER_DAY]. */
export function slotIndexFromTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10));
  const minutesFromOpen = (h - OPS_OPEN_HOUR) * 60 + m;
  const idx = Math.floor(minutesFromOpen / OPS_SLOT_MINUTES);
  return Math.max(0, Math.min(SLOTS_PER_DAY, idx));
}

/** HH:MM for a slot index. slotIndex = SLOTS_PER_DAY maps to CLOSE_HOUR:00. */
export function timeFromSlotIndex(slotIndex: number): string {
  const totalMin = OPS_OPEN_HOUR * 60 + slotIndex * OPS_SLOT_MINUTES;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "07:30" for OPS row labels. */
export function rowLabel(slotIndex: number): string {
  return timeFromSlotIndex(slotIndex);
}
