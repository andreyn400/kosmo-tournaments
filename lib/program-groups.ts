// Super-group taxonomy for the program library page.
// Each padel-ops `type` string maps to one of these high-level buckets.
// Color is applied as the left-border accent on each program card and to the
// group header.

import type { TranslationKey } from "@/lib/i18n";

export type ProgramGroupKey =
  | "games"
  | "training"
  | "kids"
  | "corporate"
  | "rental"
  | "other";

export interface ProgramGroup {
  key: ProgramGroupKey;
  labelKey: TranslationKey;
  icon: string;
  color: string;          // hex accent for borders / dots
  colorSoft: string;      // soft tint for badge backgrounds
  types: string[];        // raw type strings that fall under this group
}

export const PROGRAM_GROUPS: ProgramGroup[] = [
  {
    key: "games",
    labelKey: "programs.group.games",
    icon: "🎯",
    color: "#7c3aed",
    colorSoft: "#f3efff",
    types: ["ТУРНИР", "РАУНД РОБИН", "ОТКРЫТАЯ ИГРА"],
  },
  {
    key: "training",
    labelKey: "programs.group.training",
    icon: "🎓",
    color: "#10b981",
    colorSoft: "#ecfdf5",
    types: ["ИНДИВИДУАЛЬНАЯ ТРЕНИРОВКА", "КЛИНИКА", "КОМБО"],
  },
  {
    key: "kids",
    labelKey: "programs.group.kids",
    icon: "🧒",
    color: "#f59e0b",
    colorSoft: "#fffbeb",
    types: ["ДЕТСКАЯ ПРОГРАММА"],
  },
  {
    key: "corporate",
    labelKey: "programs.group.corporate",
    icon: "💼",
    color: "#0ea5e9",
    colorSoft: "#f0f9ff",
    types: ["КОРПОРАТИВНЫЙ ТУРНИР", "КОРПОРАТИВНАЯ АРЕНДА"],
  },
  {
    key: "rental",
    labelKey: "programs.group.rental",
    icon: "🏟",
    color: "#f43f5e",
    colorSoft: "#fff1f2",
    types: ["АРЕНДА КОРТА", "АРЕНДА ПРОСТРАНСТВА"],
  },
  {
    key: "other",
    labelKey: "programs.group.other",
    icon: "✨",
    color: "#6b7280",
    colorSoft: "#f3f4f6",
    types: ["КОМБО ПРОГРАММА"],
  },
];

// All canonical type strings, sorted by group order (for the type-filter dropdown).
export const ALL_PROGRAM_TYPES: string[] = PROGRAM_GROUPS.flatMap(
  (g) => g.types,
);

const TYPE_TO_GROUP: Map<string, ProgramGroup> = (() => {
  const m = new Map<string, ProgramGroup>();
  for (const g of PROGRAM_GROUPS) {
    for (const t of g.types) m.set(t, g);
  }
  return m;
})();

const FALLBACK_GROUP: ProgramGroup =
  PROGRAM_GROUPS.find((g) => g.key === "other") ?? PROGRAM_GROUPS[0];

/** Resolve a raw type to its group. Unknown types fall back to the "other" group. */
export function groupForType(type: string): ProgramGroup {
  return TYPE_TO_GROUP.get(type) ?? FALLBACK_GROUP;
}

// Peak window — porting padel-ops PEAK_START=17 / PEAK_END=22.
// A session is peak-priced if any minute falls within [17:00, 22:00).
export const PEAK_START_HOUR = 17;
export const PEAK_END_HOUR = 22;
export const PEAK_LABEL = `${PEAK_START_HOUR}:00–${PEAK_END_HOUR}:00`;

/** Parse "HH:MM" or "HH:MM:SS" to minutes since midnight. */
export function minutesFromTime(t: string): number {
  const [hStr, mStr = "0"] = t.split(":");
  return Number.parseInt(hStr, 10) * 60 + Number.parseInt(mStr, 10);
}

/** True if [startTime, endTime) overlaps the peak window. */
export function isPeakWindow(startTime: string, endTime: string): boolean {
  const startMin = minutesFromTime(startTime);
  const endMin = minutesFromTime(endTime);
  const peakStart = PEAK_START_HOUR * 60;
  const peakEnd = PEAK_END_HOUR * 60;
  return startMin < peakEnd && endMin > peakStart;
}

/** Format a minutes-since-midnight integer back to "HH:MM". */
export function timeFromMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
