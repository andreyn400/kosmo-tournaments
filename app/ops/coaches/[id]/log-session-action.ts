"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { createSessionWithCoach } from "@/lib/queries/schedule-sessions";
import {
  validateSessionInput,
  type RawSessionInput,
} from "./session-input";

export async function logSessionAction(
  coachId: string,
  raw: RawSessionInput,
): Promise<{ id?: string; error?: string }> {
  if (!coachId) return { error: "Тренер не найден." };

  const program = raw.program_id ? await getProgram(raw.program_id) : null;
  const v = validateSessionInput(raw, program);
  if (!v.ok) return { error: v.error };

  try {
    const id = await createSessionWithCoach(v.value, coachId);
    revalidatePath(`/ops/coaches/${coachId}`);
    revalidatePath("/ops/coaches");
    return { id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось записать сессию.",
    };
  }
}
