"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { updateScheduleSession } from "@/lib/queries/schedule-sessions";
import { listSessionsForRange } from "@/lib/queries/schedule";
import { listRentalBlocksForRange } from "@/lib/queries/rentals";
import {
  detectCollision,
  type CollisionExisting,
} from "@/lib/schedule-collisions";
import { validateScheduleInput, type RawScheduleInput } from "./schedule-input";

export async function updateScheduleAction(
  sessionId: string,
  raw: RawScheduleInput,
): Promise<{ error?: string }> {
  const program = raw.program_id ? await getProgram(raw.program_id) : null;

  const v = validateScheduleInput(raw, program);
  if (!v.ok) return { error: v.error };

  const [existingSessions, existingRentals] = await Promise.all([
    listSessionsForRange(v.value.date, v.value.date),
    listRentalBlocksForRange(v.value.date, v.value.date),
  ]);
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
      program_name: `Аренда: ${b.client_name}`,
    })),
  ];
  const conflict = detectCollision(existing, {
    id: sessionId, // exclude self from collision
    date: v.value.date,
    start_time: v.value.start_time,
    end_time: v.value.end_time,
    court_ids: v.value.court_ids,
  });
  if (conflict) return { error: conflict };

  try {
    await updateScheduleSession(sessionId, v.value, v.coachIds);
    revalidatePath("/ops/schedule");
    revalidatePath("/ops/coaches");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось обновить сессию.",
    };
  }
}
