import type { ScoringSystem } from "./types";

export type ScoringGroup = "points" | "games" | "sets";

export const SCORING_SYSTEMS: ScoringSystem[] = [
  "points_16",
  "points_21",
  "points_32",
  "games_16",
  "games_24",
  "games_32",
  "sets_best3",
  "sets_supertiebreak",
];

export const DEFAULT_SCORING_SYSTEM: ScoringSystem = "games_24";

export const SCORING_SYSTEM_LABEL_RU: Record<ScoringSystem, string> = {
  points_16: "До 16 очков",
  points_21: "До 21 очка",
  points_32: "До 32 очков",
  games_16: "До 16 геймов",
  games_24: "До 24 геймов (рекомендуется)",
  games_32: "До 32 геймов",
  sets_best3: "3 сета (с тай-брейком)",
  sets_supertiebreak: "2 сета + супер тай-брейк",
};

export const SCORING_SYSTEM_HELPER_RU: Record<ScoringSystem, string> = {
  points_16: "Команды играют, пока одна не наберёт 16 очков.",
  points_21: "Команды играют, пока одна не наберёт 21 очко.",
  points_32: "Команды играют, пока одна не наберёт 32 очка.",
  games_16: "Около 16 геймов на матч (±2). Без ничьих.",
  games_24: "Стандарт Kosmo: около 24 геймов на матч (±2). Без ничьих.",
  games_32: "Около 32 геймов на матч (±2). Без ничьих.",
  sets_best3:
    "Лучший из 3 сетов. Сет до 6 геймов с тай-брейком при 6-6, 7-5 при 5-5.",
  sets_supertiebreak:
    "Два сета по 6 геймов; при счёте 1-1 — супер тай-брейк до 10.",
};

export const SCORING_GROUP_LABEL_RU: Record<ScoringGroup, string> = {
  points: "Очки",
  games: "Геймы",
  sets: "Сеты",
};

export function scoringGroup(s: ScoringSystem): ScoringGroup {
  if (s.startsWith("points_")) return "points";
  if (s.startsWith("games_")) return "games";
  return "sets";
}

export function scoringTarget(s: ScoringSystem): number | null {
  switch (s) {
    case "points_16":
    case "games_16":
      return 16;
    case "points_21":
      return 21;
    case "points_32":
    case "games_32":
      return 32;
    case "games_24":
      return 24;
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
  | { ok: false; error: string };

export function validatePointsScore(
  system: ScoringSystem,
  a: number,
  b: number,
): ValidationResult {
  const target = scoringTarget(system);
  if (target == null) return { ok: false, error: "Неверная система счёта" };
  if (!Number.isInteger(a) || !Number.isInteger(b))
    return { ok: false, error: "Очки должны быть целыми числами" };
  if (a < 0 || b < 0)
    return { ok: false, error: "Очки не могут быть отрицательными" };
  const aAt = a === target;
  const bAt = b === target;
  if (aAt && bAt)
    return { ok: false, error: "Обе команды не могут набрать ровно" };
  if (!aAt && !bAt)
    return {
      ok: false,
      error: `Одна из команд должна набрать ${target} очков`,
    };
  const loser = aAt ? b : a;
  if (loser >= target)
    return {
      ok: false,
      error: `Проигравший должен набрать меньше ${target}`,
    };
  return { ok: true };
}

export function validateGamesScore(
  system: ScoringSystem,
  a: number,
  b: number,
): ValidationResult {
  const target = scoringTarget(system);
  if (target == null) return { ok: false, error: "Неверная система счёта" };
  if (!Number.isInteger(a) || !Number.isInteger(b))
    return { ok: false, error: "Геймы должны быть целыми числами" };
  if (a < 0 || b < 0)
    return { ok: false, error: "Геймы не могут быть отрицательными" };
  if (a === b) return { ok: false, error: "Не может быть ничьей" };
  const total = a + b;
  if (total < target - 2 || total > target + 2)
    return {
      ok: false,
      error: `Сумма геймов должна быть от ${target - 2} до ${target + 2}`,
    };
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
    return { ok: false, error: "Введите счёт сетов" };
  if (detail.sets.length < 2)
    return { ok: false, error: "Введите оба сета" };
  if (detail.sets.length > 3)
    return { ok: false, error: "Не больше 3 сетов" };

  for (let i = 0; i < 2; i++) {
    const [a, b] = detail.sets[i];
    if (!isValidRegularSet(a, b))
      return { ok: false, error: `Неверный счёт сета ${i + 1}` };
  }

  const t1FirstTwo = detail.sets
    .slice(0, 2)
    .filter(([a, b]) => a > b).length;
  const t2FirstTwo = 2 - t1FirstTwo;

  if (t1FirstTwo === 2 || t2FirstTwo === 2) {
    if (detail.sets.length !== 2)
      return { ok: false, error: "Третий сет не нужен — счёт 2-0" };
    if (detail.supertiebreak)
      return { ok: false, error: "Супер тай-брейк не нужен — счёт 2-0" };
    return { ok: true };
  }

  if (system === "sets_supertiebreak") {
    if (detail.sets.length !== 2)
      return {
        ok: false,
        error: "Третий обычный сет не играется — должен быть супер тай-брейк",
      };
    if (!detail.supertiebreak)
      return { ok: false, error: "Введите супер тай-брейк" };
    if (!isValidSuperTiebreak(...detail.supertiebreak))
      return { ok: false, error: "Неверный супер тай-брейк (до 10, +2)" };
    return { ok: true };
  }

  if (detail.sets.length !== 3)
    return { ok: false, error: "Введите третий сет" };
  if (!isValidRegularSet(...detail.sets[2]))
    return { ok: false, error: "Неверный счёт третьего сета" };
  if (detail.supertiebreak)
    return { ok: false, error: "Супер тай-брейк не используется в этой системе" };
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
