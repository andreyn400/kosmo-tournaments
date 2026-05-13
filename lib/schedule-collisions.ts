import { minutesFromTime } from "./program-groups";

/**
 * Pure collision detection for scheduler placement. Used both client-side
 * (preview / drag ghost) and server-side (final write-time enforcement).
 *
 * Two sessions collide when:
 *   1. they are on the same `date`,
 *   2. their `[start_time, end_time)` intervals overlap (minute-granular),
 *   3. their `court_ids` sets intersect (at least one shared court).
 *
 * Cancelled sessions are ignored — they still occupy a row visually but they
 * don't block placements. (If an operator wants to "uncancel" a session into a
 * conflict, the activation path is responsible for re-checking.)
 *
 * Returns a Russian-language error message naming the conflicting session, or
 * `null` if the candidate is clear.
 */
export interface CollisionCandidate {
  /** Defined for edit mode so the candidate doesn't collide with itself. */
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
}

export interface CollisionExisting {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  status: "scheduled" | "completed" | "cancelled";
  program_name?: string | null;
}

export function detectCollision(
  existing: CollisionExisting[],
  candidate: CollisionCandidate,
): string | null {
  const cStart = minutesFromTime(candidate.start_time);
  const cEnd = minutesFromTime(candidate.end_time);
  if (cEnd <= cStart) {
    return "Время окончания должно быть позже начала.";
  }
  if (candidate.court_ids.length === 0) {
    return "Нужно выбрать хотя бы один корт.";
  }
  const cCourts = new Set(candidate.court_ids);

  for (const e of existing) {
    if (e.id === candidate.id) continue;
    if (e.status === "cancelled") continue;
    if (e.date !== candidate.date) continue;

    const eStart = minutesFromTime(e.start_time);
    const eEnd = minutesFromTime(e.end_time);
    const timeOverlap = cStart < eEnd && cEnd > eStart;
    if (!timeOverlap) continue;

    const sharedCourt = e.court_ids.some((id) => cCourts.has(id));
    if (!sharedCourt) continue;

    const label = e.program_name
      ? `«${e.program_name}» (${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)})`
      : `сессия ${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}`;
    return `Пересекается с ${label}.`;
  }

  return null;
}

/**
 * Helper for UIs: returns true if the given (date, time, court) cell is
 * occupied by any non-cancelled existing session. Used by the empty-cell
 * hover/click handler to skip cells under a session block.
 */
export function isCellOccupied(
  existing: CollisionExisting[],
  date: string,
  hhmm: string,
  courtId: string,
): boolean {
  const t = minutesFromTime(hhmm);
  for (const e of existing) {
    if (e.status === "cancelled") continue;
    if (e.date !== date) continue;
    if (!e.court_ids.includes(courtId)) continue;
    const s = minutesFromTime(e.start_time);
    const f = minutesFromTime(e.end_time);
    if (t >= s && t < f) return true;
  }
  return false;
}
