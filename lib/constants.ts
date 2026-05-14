import type { PadelLevel } from "./types";

export const PADEL_LEVELS: PadelLevel[] = [
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A",
  "OPEN",
];

export const DEFAULT_ELO_BY_LEVEL: Record<PadelLevel, number> = {
  D: 750,
  "D+": 850,
  "C-": 950,
  C: 1050,
  "C+": 1150,
  "B-": 1275,
  B: 1425,
  "B+": 1600,
  A: 1850,
  OPEN: 2050,
};
