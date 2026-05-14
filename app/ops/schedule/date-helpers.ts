/**
 * Date arithmetic for the scheduler. All inputs and outputs are YYYY-MM-DD
 * strings (locale- and timezone-independent). No Date objects leak past this
 * module's boundary. For locale-aware display formatting see
 * `lib/i18n/format.ts`.
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(s: string | undefined | null): s is string {
  return !!s && DATE_RE.test(s);
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function shiftDays(dateIso: string, deltaDays: number): string {
  const d = new Date(dateIso + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Days of a week as an array of YYYY-MM-DD, Monday-first. */
export function weekDays(mondayIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDays(mondayIso, i));
}

/** ISO Monday for the week containing the given date. Locale-independent. */
export function weekMondayIso(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** ISO Sunday for the same week. */
export function weekSundayIso(dateIso: string): string {
  const mon = new Date(weekMondayIso(dateIso) + "T00:00:00");
  mon.setDate(mon.getDate() + 6);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(
    mon.getDate(),
  ).padStart(2, "0")}`;
}

/** Mon-first weekday index for an ISO date (0=Mon..6=Sun). */
export function weekdayMonFirst(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

/** Day-of-month number for an ISO date. */
export function dayOfMonth(iso: string): number {
  return new Date(iso + "T00:00:00").getDate();
}
