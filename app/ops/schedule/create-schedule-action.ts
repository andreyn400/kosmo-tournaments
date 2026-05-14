"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { createScheduleSession } from "@/lib/queries/schedule-sessions";
import { listSessionsForRange } from "@/lib/queries/schedule";
import { listRentalBlocksForRange } from "@/lib/queries/rentals";
import {
  detectCollision,
  type CollisionExisting,
} from "@/lib/schedule-collisions";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateScheduleInput, type RawScheduleInput } from "./schedule-input";

export async function createScheduleAction(
  raw: RawScheduleInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  const program = raw.program_id ? await getProgram(raw.program_id) : null;

  const v = validateScheduleInput(raw, program);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  // Server-side collision re-check against BOTH sessions and rental blocks.
  // Rentals are read-only from the scheduler but they still block placement
  // on the same court+time.
  const [existingSessions, existingRentals] = await Promise.all([
    listSessionsForRange(v.value.date, v.value.date),
    listRentalBlocksForRange(v.value.date, v.value.date),
  ]);
  const rentalLabel = (client: string) =>
    dict["error.schedule.rental_label"].replace("{client}", client);
  const existing: CollisionExisting[] = [
    ...existingSessions.map((s) => ({
      id: s.id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      court_ids: s.court_ids,
      status: s.status,
      program_name: s.program_name,
    })),
    ...existingRentals.map((b) => ({
      id: b.id,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      court_ids: b.court_ids,
      status: "scheduled" as const,
      program_name: rentalLabel(b.client_name),
    })),
  ];
  const conflict = detectCollision(existing, {
    date: v.value.date,
    start_time: v.value.start_time,
    end_time: v.value.end_time,
    court_ids: v.value.court_ids,
  });
  if (conflict) return { error: resolveErrorWithDict(conflict, dict) };

  try {
    const id = await createScheduleSession(v.value, v.coachIds);
    revalidatePath("/ops/schedule");
    revalidatePath("/ops/coaches");
    return { id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.create.session"],
    };
  }
}
