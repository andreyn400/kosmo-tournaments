// Display helpers shared by the panel and child cards.

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

export function perPlayer(
  total: number,
  players: number | null,
): string | null {
  if (!players || players <= 0) return null;
  return formatRub(Math.round(total / players));
}
