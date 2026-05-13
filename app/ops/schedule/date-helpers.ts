/**
 * Date arithmetic for the scheduler. All inputs and outputs are YYYY-MM-DD
 * strings (locale- and timezone-independent). No Date objects leak past this
 * module's boundary.
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

/**
 * Format a YYYY-MM-DD as a Russian-language label. `style="long"` →
 * "пн, 12 мая 2026"; `style="dayHeader"` → "ПН 12"; `style="weekHeader"` →
 * "12 мая – 18 мая 2026" when paired with the week-end.
 */
const DOW_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const DOW_SHORT_CAPS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const MONTH_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function formatDayLong(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  const dow = DOW_SHORT[d.getDay()];
  const day = d.getDate();
  const month = MONTH_GENITIVE[d.getMonth()];
  return `${dow}, ${day} ${month} ${d.getFullYear()}`;
}

export function formatDayHeader(dateIso: string): { dow: string; day: number } {
  const d = new Date(dateIso + "T00:00:00");
  return { dow: DOW_SHORT_CAPS[d.getDay()], day: d.getDate() };
}

export function formatWeekRange(mondayIso: string, sundayIso: string): string {
  const mon = new Date(mondayIso + "T00:00:00");
  const sun = new Date(sundayIso + "T00:00:00");
  const monDay = mon.getDate();
  const monMonth = MONTH_GENITIVE[mon.getMonth()];
  const sunDay = sun.getDate();
  const sunMonth = MONTH_GENITIVE[sun.getMonth()];
  if (mon.getMonth() === sun.getMonth() && mon.getFullYear() === sun.getFullYear()) {
    return `${monDay}–${sunDay} ${sunMonth} ${sun.getFullYear()}`;
  }
  if (mon.getFullYear() === sun.getFullYear()) {
    return `${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${sun.getFullYear()}`;
  }
  return `${monDay} ${monMonth} ${mon.getFullYear()} – ${sunDay} ${sunMonth} ${sun.getFullYear()}`;
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
