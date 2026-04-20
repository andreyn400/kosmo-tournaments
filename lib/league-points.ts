export type PointsTable = Record<string, Record<string, number>>;

export const DEFAULT_POINTS_TABLE: PointsTable = {
  "16": { "1": 14, "2": 12, "3": 10, "4": 8, "5": 6, "6": 4, "7": 2, "8": 1 },
  "12": { "1": 10, "2": 8, "3": 6, "4": 4, "5": 2, "6": 1 },
  "8": { "1": 6, "2": 4, "3": 2, "4": 1 },
  "4": { "1": 2, "2": 1 },
};

function bucketForPlayerCount(
  table: PointsTable,
  playerCount: number,
): string | null {
  const available = Object.keys(table)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  for (const n of available) {
    if (playerCount <= n) return String(n);
  }
  return available.length > 0 ? String(available[available.length - 1]) : null;
}

export function pointsForPosition(
  table: PointsTable,
  playerCount: number,
  position: number,
): number {
  if (position < 1) return 0;
  const bucket = bucketForPlayerCount(table, playerCount);
  if (!bucket) return 0;
  const entry = table[bucket];
  if (!entry) return 0;
  const raw = entry[String(position)];
  return typeof raw === "number" ? raw : 0;
}
