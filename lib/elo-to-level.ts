import type { PadelLevel } from "./types";

export function eloToLevel(elo: number): PadelLevel {
  if (elo < 800) return "D";
  if (elo < 900) return "D+";
  if (elo < 1000) return "C-";
  if (elo < 1100) return "C";
  if (elo < 1200) return "C+";
  if (elo < 1350) return "B-";
  if (elo < 1500) return "B";
  if (elo < 1700) return "B+";
  if (elo < 2000) return "A";
  return "OPEN";
}
