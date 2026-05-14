import type { Lang } from "./types";

const RU_MONTH_GENITIVE = [
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

const RU_MONTH_NOMINATIVE = [
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

const EN_MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EN_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const RU_WEEKDAY_LONG = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

const RU_WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const EN_WEEKDAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EN_WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function monIndexFromIso(iso: string): number {
  const [y, m, d] = parseIso(iso);
  const jsDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (jsDow + 6) % 7;
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = parseIso(iso);
  if (lang === "ru") {
    return `${d} ${RU_MONTH_GENITIVE[m - 1]} ${y}`;
  }
  return `${EN_MONTH_LONG[m - 1]} ${d}, ${y}`;
}

export function formatDateShort(iso: string, lang: Lang): string {
  const [, m, d] = parseIso(iso);
  if (lang === "ru") {
    return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
  }
  return `${EN_MONTH_SHORT[m - 1]} ${d}`;
}

export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(trimmed);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function formatDateTime(
  iso: string,
  time: string | null | undefined,
  lang: Lang,
): string {
  const date = formatDate(iso, lang);
  const t = formatTime(time);
  return t ? `${date} · ${t}` : date;
}

export function formatDateRange(
  startIso: string,
  endIso: string | null,
  lang: Lang,
): string {
  if (!endIso || endIso === startIso) return formatDate(startIso, lang);
  const [sy, sm, sd] = parseIso(startIso);
  const [ey, em, ed] = parseIso(endIso);
  if (lang === "ru") {
    if (sy === ey && sm === em) {
      return `${sd}–${ed} ${RU_MONTH_GENITIVE[sm - 1]} ${sy}`;
    }
    if (sy === ey) {
      return `${sd} ${RU_MONTH_GENITIVE[sm - 1]} — ${ed} ${RU_MONTH_GENITIVE[em - 1]} ${sy}`;
    }
    return `${formatDate(startIso, lang)} — ${formatDate(endIso, lang)}`;
  }
  if (sy === ey && sm === em) {
    return `${EN_MONTH_SHORT[sm - 1]} ${sd}–${ed}, ${sy}`;
  }
  if (sy === ey) {
    return `${EN_MONTH_SHORT[sm - 1]} ${sd} — ${EN_MONTH_SHORT[em - 1]} ${ed}, ${sy}`;
  }
  return `${formatDate(startIso, lang)} — ${formatDate(endIso, lang)}`;
}

export function formatWeekday(
  iso: string,
  lang: Lang,
  opts?: { short?: boolean },
): string {
  const idx = monIndexFromIso(iso);
  if (lang === "ru") {
    return opts?.short ? RU_WEEKDAY_SHORT[idx] : RU_WEEKDAY_LONG[idx];
  }
  return opts?.short ? EN_WEEKDAY_SHORT[idx] : EN_WEEKDAY_LONG[idx];
}

export function formatMonth(
  year: number,
  monthIdx: number,
  lang: Lang,
): string {
  if (lang === "ru") {
    return `${RU_MONTH_NOMINATIVE[monthIdx]} ${year}`;
  }
  return `${EN_MONTH_LONG[monthIdx]} ${year}`;
}

/** Mon→Sun short weekday labels in the requested language. */
export function getWeekdayShortLabels(lang: Lang): readonly string[] {
  return lang === "ru" ? RU_WEEKDAY_SHORT : EN_WEEKDAY_SHORT;
}

/** Mon→Sun long weekday labels in the requested language. */
export function getWeekdayLongLabels(lang: Lang): readonly string[] {
  return lang === "ru" ? RU_WEEKDAY_LONG : EN_WEEKDAY_LONG;
}

/** Format YYYY-MM-DD as "пн, 12 мая 2026" / "Mon, May 12, 2026". */
export function formatDateWithWeekday(iso: string, lang: Lang): string {
  const [y, m, d] = parseIso(iso);
  const monIdx = monIndexFromIso(iso);
  if (lang === "ru") {
    const SHORT_DOW_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
    return `${SHORT_DOW_RU[monIdx]}, ${d} ${RU_MONTH_GENITIVE[m - 1]} ${y}`;
  }
  return `${EN_WEEKDAY_SHORT[monIdx]}, ${EN_MONTH_LONG[m - 1]} ${d}, ${y}`;
}

/** Format YYYY-MM-DD as "Воскресенье, 12 мая 2026" / "Sunday, May 12, 2026". */
export function formatLongDateWithWeekday(iso: string, lang: Lang): string {
  const [y, m, d] = parseIso(iso);
  const monIdx = monIndexFromIso(iso);
  if (lang === "ru") {
    return `${RU_WEEKDAY_LONG[monIdx]}, ${d} ${RU_MONTH_GENITIVE[m - 1]} ${y}`;
  }
  return `${EN_WEEKDAY_LONG[monIdx]}, ${EN_MONTH_LONG[m - 1]} ${d}, ${y}`;
}

/** Format YYYY-MM-DD as "пн, 13 апр" / "Mon, Apr 13". */
export function formatShortDateWithWeekday(iso: string, lang: Lang): string {
  const [, m, d] = parseIso(iso);
  const monIdx = monIndexFromIso(iso);
  if (lang === "ru") {
    const SHORT_MONTHS_RU = [
      "янв",
      "фев",
      "мар",
      "апр",
      "май",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ];
    const SHORT_DOW_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
    return `${SHORT_DOW_RU[monIdx]}, ${d} ${SHORT_MONTHS_RU[m - 1]}`;
  }
  return `${EN_WEEKDAY_SHORT[monIdx]}, ${EN_MONTH_SHORT[m - 1]} ${d}`;
}

/** Format YYYY-MM month string (e.g. "2026-04") as "Апрель 2026" / "April 2026". */
export function formatMonthStr(monthStr: string, lang: Lang): string {
  const [yStr, mStr] = monthStr.split("-");
  return formatMonth(Number(yStr), Number(mStr) - 1, lang);
}

/** Pick the correct plural form for `count` using language rules.
 *  - RU: one (1, 21, …), few (2-4, 22-24, …), many (0, 5-20, 25-30, …).
 *  - EN: one (1), many (everything else; `few` is unused). */
export function pluralize<T = string>(
  count: number,
  forms: { one: T; few?: T; many: T },
  lang: Lang,
): T {
  if (lang === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return forms.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return forms.few ?? forms.many;
    }
    return forms.many;
  }
  return count === 1 ? forms.one : forms.many;
}

/** Format a duration in minutes as "30 мин" / "30 min" or "1 ч 30 мин" / "1h 30min". */
export function formatDuration(minutes: number, lang: Lang): string {
  const minLabel = lang === "ru" ? "мин" : "min";
  const hourLabel = lang === "ru" ? "ч" : "h";
  if (minutes < 60) return `${minutes} ${minLabel}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ${hourLabel}`;
  return `${hours} ${hourLabel} ${rest} ${minLabel}`;
}

function groupDigits(n: number, separator: string): string {
  const abs = Math.abs(Math.round(n));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatNumber(n: number, lang: Lang): string {
  const sign = n < 0 ? "−" : "";
  const separator = lang === "ru" ? " " : ",";
  return `${sign}${groupDigits(n, separator)}`;
}

export function formatRub(
  rub: number,
  lang: Lang,
  opts?: { signed?: boolean },
): string {
  const sign = rub < 0 ? "−" : opts?.signed && rub > 0 ? "+" : "";
  const separator = lang === "ru" ? " " : ",";
  return `${sign}₽${groupDigits(rub, separator)}`;
}
