const MONTHS_GENITIVE_RU = [
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

export function formatDateRu(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_GENITIVE_RU[m - 1]} ${y}`;
}

export function formatTimeRu(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)/.exec(trimmed);
  return m ? `${m[1]}:${m[2]}` : null;
}

export function formatDateTimeRu(
  iso: string,
  time: string | null | undefined,
): string {
  const date = formatDateRu(iso);
  const t = formatTimeRu(time);
  return t ? `${date} · ${t}` : date;
}

export function formatDateRangeRu(
  startIso: string,
  endIso: string | null,
): string {
  if (!endIso || endIso === startIso) return formatDateRu(startIso);
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  if (sy === ey && sm === em) {
    return `${sd}–${ed} ${MONTHS_GENITIVE_RU[sm - 1]} ${sy}`;
  }
  if (sy === ey) {
    return `${sd} ${MONTHS_GENITIVE_RU[sm - 1]} — ${ed} ${MONTHS_GENITIVE_RU[em - 1]} ${sy}`;
  }
  return `${formatDateRu(startIso)} — ${formatDateRu(endIso)}`;
}
