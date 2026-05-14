import type { ScoringSystem } from "./types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export type ScoringGroup = "points" | "games" | "combined" | "sets";

export const SCORING_SYSTEMS: ScoringSystem[] = [
  "points_16",
  "points_21",
  "points_32",
  "games_16",
  "games_24",
  "games_32",
  "combined_21",
  "combined_32",
  "combined_42",
  "sets_best3",
  "sets_supertiebreak",
];

export const DEFAULT_SCORING_SYSTEM: ScoringSystem = "games_24";

export function scoringGroup(s: ScoringSystem): ScoringGroup {
  if (s.startsWith("points_")) return "points";
  if (s.startsWith("games_")) return "games";
  if (s.startsWith("combined_")) return "combined";
  return "sets";
}

export function scoringTarget(s: ScoringSystem): number | null {
  switch (s) {
    case "points_16":
    case "games_16":
      return 16;
    case "points_21":
    case "combined_21":
      return 21;
    case "points_32":
    case "games_32":
    case "combined_32":
      return 32;
    case "games_24":
      return 24;
    case "combined_42":
      return 42;
    default:
      return null;
  }
}

export interface SetsDetail {
  sets: Array<[number, number]>;
  supertiebreak?: [number, number];
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: FieldError };

export function validatePointsScore(
  system: ScoringSystem,
  a: number,
  b: number,
): ValidationResult {
  const target = scoringTarget(system);
  if (target == null) return { ok: false, error: fieldErr("error.score.invalid_system") };
  if (!Number.isInteger(a) || !Number.isInteger(b))
    return { ok: false, error: fieldErr("error.score.points_integer") };
  if (a < 0 || b < 0)
    return { ok: false, error: fieldErr("error.score.points_negative") };
  const aAt = a === target;
  const bAt = b === target;
  if (aAt && bAt)
    return { ok: false, error: fieldErr("error.score.both_teams_equal") };
  if (!aAt && !bAt)
    return {
      ok: false,
      error: fieldErr("error.score.one_team_must_reach", { target }),
    };
  const loser = aAt ? b : a;
  if (loser >= target)
    return {
      ok: false,
      error: fieldErr("error.score.loser_must_be_less", { target }),
    };
  return { ok: true };
}

export function validateGamesScore(
  system: ScoringSystem,
  a: number,
  b: number,
): ValidationResult {
  const target = scoringTarget(system);
  if (target == null) return { ok: false, error: fieldErr("error.score.invalid_system") };
  if (!Number.isInteger(a) || !Number.isInteger(b))
    return { ok: false, error: fieldErr("error.score.games_integer") };
  if (a < 0 || b < 0)
    return { ok: false, error: fieldErr("error.score.games_negative") };
  if (a === b) return { ok: false, error: fieldErr("error.score.no_tie") };
  const total = a + b;
  if (total < target - 2 || total > target + 2)
    return {
      ok: false,
      error: fieldErr("error.score.games_sum_range", {
        min: target - 2,
        max: target + 2,
      }),
    };
  return { ok: true };
}

export function validateCombinedScore(
  system: ScoringSystem,
  a: number,
  b: number,
): ValidationResult {
  const target = scoringTarget(system);
  if (target == null) return { ok: false, error: fieldErr("error.score.invalid_system") };
  if (!Number.isInteger(a) || !Number.isInteger(b))
    return { ok: false, error: fieldErr("error.score.points_integer") };
  if (a < 0 || b < 0)
    return { ok: false, error: fieldErr("error.score.points_negative") };
  const total = a + b;
  if (total !== target)
    return {
      ok: false,
      error: fieldErr("error.score.combined_sum_must_equal", {
        target,
        total,
      }),
    };
  if (a === b)
    return { ok: false, error: fieldErr("error.score.combined_no_tie") };
  return { ok: true };
}

function isValidRegularSet(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0) return false;
  if (a === 6 && b >= 0 && b <= 4) return true;
  if (b === 6 && a >= 0 && a <= 4) return true;
  if (a === 7 && (b === 5 || b === 6)) return true;
  if (b === 7 && (a === 5 || a === 6)) return true;
  return false;
}

function isValidSuperTiebreak(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0) return false;
  const max = Math.max(a, b);
  const diff = Math.abs(a - b);
  if (max < 10) return false;
  if (max === 10 && diff < 2) return false;
  if (max > 10 && diff !== 2) return false;
  return true;
}

export function validateSetsScore(
  system: ScoringSystem,
  detail: SetsDetail,
): ValidationResult {
  if (!detail || !Array.isArray(detail.sets))
    return { ok: false, error: fieldErr("error.score.sets_required") };
  if (detail.sets.length < 2)
    return { ok: false, error: fieldErr("error.score.sets_both_required") };
  if (detail.sets.length > 3)
    return { ok: false, error: fieldErr("error.score.sets_max_3") };

  for (let i = 0; i < 2; i++) {
    const [a, b] = detail.sets[i];
    if (!isValidRegularSet(a, b))
      return {
        ok: false,
        error: fieldErr("error.score.set_invalid", { n: i + 1 }),
      };
  }

  const t1FirstTwo = detail.sets
    .slice(0, 2)
    .filter(([a, b]) => a > b).length;
  const t2FirstTwo = 2 - t1FirstTwo;

  if (t1FirstTwo === 2 || t2FirstTwo === 2) {
    if (detail.sets.length !== 2)
      return { ok: false, error: fieldErr("error.score.third_set_not_needed") };
    if (detail.supertiebreak)
      return {
        ok: false,
        error: fieldErr("error.score.supertiebreak_not_needed"),
      };
    return { ok: true };
  }

  if (system === "sets_supertiebreak") {
    if (detail.sets.length !== 2)
      return {
        ok: false,
        error: fieldErr("error.score.no_third_regular_set"),
      };
    if (!detail.supertiebreak)
      return {
        ok: false,
        error: fieldErr("error.score.supertiebreak_required"),
      };
    if (!isValidSuperTiebreak(...detail.supertiebreak))
      return {
        ok: false,
        error: fieldErr("error.score.supertiebreak_invalid"),
      };
    return { ok: true };
  }

  if (detail.sets.length !== 3)
    return { ok: false, error: fieldErr("error.score.third_set_required") };
  if (!isValidRegularSet(...detail.sets[2]))
    return { ok: false, error: fieldErr("error.score.third_set_invalid") };
  if (detail.supertiebreak)
    return {
      ok: false,
      error: fieldErr("error.score.supertiebreak_not_used"),
    };
  return { ok: true };
}

export function setsWon(detail: SetsDetail): [number, number] {
  let t1 = 0;
  let t2 = 0;
  for (const [a, b] of detail.sets) {
    if (a > b) t1 += 1;
    else if (b > a) t2 += 1;
  }
  if (detail.supertiebreak) {
    const [a, b] = detail.supertiebreak;
    if (a > b) t1 += 1;
    else if (b > a) t2 += 1;
  }
  return [t1, t2];
}

export function setsGameDifferential(detail: SetsDetail): [number, number] {
  let t1 = 0;
  let t2 = 0;
  for (const [a, b] of detail.sets) {
    t1 += a;
    t2 += b;
  }
  if (detail.supertiebreak) {
    t1 += detail.supertiebreak[0];
    t2 += detail.supertiebreak[1];
  }
  return [t1, t2];
}

export function setsSummary(detail: SetsDetail): string {
  const parts = detail.sets.map(([a, b]) => `${a}–${b}`);
  if (detail.supertiebreak) {
    parts.push(`${detail.supertiebreak[0]}–${detail.supertiebreak[1]}`);
  }
  return parts.join(", ");
}

export function isSetsDetail(value: unknown): value is SetsDetail {
  if (!value || typeof value !== "object") return false;
  const v = value as { sets?: unknown; supertiebreak?: unknown };
  if (!Array.isArray(v.sets)) return false;
  for (const s of v.sets) {
    if (!Array.isArray(s) || s.length !== 2) return false;
    if (typeof s[0] !== "number" || typeof s[1] !== "number") return false;
  }
  if (v.supertiebreak != null) {
    const st = v.supertiebreak;
    if (!Array.isArray(st) || st.length !== 2) return false;
    if (typeof st[0] !== "number" || typeof st[1] !== "number") return false;
  }
  return true;
}
