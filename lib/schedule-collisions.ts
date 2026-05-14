import { minutesFromTime } from "./program-groups";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

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
 * Returns a typed FieldError describing the conflict, or `null` if the
 * candidate is clear. The caller resolves the error via the i18n dictionary.
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
): FieldError | null {
  const cStart = minutesFromTime(candidate.start_time);
  const cEnd = minutesFromTime(candidate.end_time);
  if (cEnd <= cStart) {
    return fieldErr("error.invalid.end_time_after_start_alt");
  }
  if (candidate.court_ids.length === 0) {
    return fieldErr("error.schedule.at_least_one_court_required");
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

    const start = e.start_time.slice(0, 5);
    const end = e.end_time.slice(0, 5);
    if (e.program_name) {
      return fieldErr("error.schedule.overlaps_named", {
        name: e.program_name,
        start,
        end,
      });
    }
    return fieldErr("error.schedule.overlaps_anon", { start, end });
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
