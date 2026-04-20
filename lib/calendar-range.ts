const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(s: string | null | undefined): boolean {
  if (!s || !ISO_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function toIso(year: number, month0: number, day: number): string {
  const mm = String(month0 + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function todayIso(): string {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(iso: string, n: number): string {
  const { year, month, day } = parseIso(iso);
  const d = new Date(Date.UTC(year, month, day + n));
  return toIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function addMonths(iso: string, n: number): string {
  const { year, month, day } = parseIso(iso);
  const targetMonth = month + n;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDay);
  return toIso(targetYear, normalizedMonth, clampedDay);
}

export function startOfWeekMon(iso: string): string {
  const { year, month, day } = parseIso(iso);
  const jsDow = new Date(Date.UTC(year, month, day)).getUTCDay();
  const monDow = (jsDow + 6) % 7;
  return addDays(iso, -monDow);
}

export function startOfMonth(iso: string): string {
  const { year, month } = parseIso(iso);
  return toIso(year, month, 1);
}

export function endOfMonth(iso: string): string {
  const { year, month } = parseIso(iso);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return toIso(year, month, lastDay);
}

export function dayRange(iso: string): { start: string; end: string } {
  return { start: iso, end: iso };
}

export function weekRange(iso: string): { start: string; end: string } {
  const start = startOfWeekMon(iso);
  return { start, end: addDays(start, 6) };
}

export function monthRange(iso: string): { start: string; end: string } {
  return { start: startOfMonth(iso), end: endOfMonth(iso) };
}

export function monthGridRange(iso: string): { start: string; end: string } {
  const start = startOfWeekMon(startOfMonth(iso));
  return { start, end: addDays(start, 41) };
}

export function isoDateList(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function weekdayMonIndex(iso: string): number {
  const { year, month, day } = parseIso(iso);
  const jsDow = new Date(Date.UTC(year, month, day)).getUTCDay();
  return (jsDow + 6) % 7;
}
