/** Format an integer ruble amount as "₽184 250" (RU thin-space grouping). */
export function formatRub(rub: number): string {
  const sign = rub < 0 ? "−" : "";
  const abs = Math.abs(Math.round(rub));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}₽${grouped}`;
}
