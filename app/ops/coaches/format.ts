const RUB_FMT = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatRub(value: number): string {
  return RUB_FMT.format(value);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

export const DAY_LABELS_SHORT = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
export const DAY_LABELS_LONG = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
export const MONTH_LABELS = [
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

/** Format YYYY-MM-DD to "пн, 13 апр". */
export function formatDateRu(yyyyMmDd: string): string {
  const d = new Date(yyyyMmDd + "T00:00:00");
  const day = d.getDate();
  const monthShort = [
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
  ][d.getMonth()];
  const dow = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
  return `${dow}, ${day} ${monthShort}`;
}

export function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(monthStr: string): string {
  const [yStr, mStr] = monthStr.split("-");
  const year = Number.parseInt(yStr, 10);
  const mon = Number.parseInt(mStr, 10);
  return `${MONTH_LABELS[mon - 1]} ${year}`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function rateTypeLabel(t: "flat" | "percent"): string {
  return t === "flat" ? "Фиксированная" : "Процент";
}
