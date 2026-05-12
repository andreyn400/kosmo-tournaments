"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { updateSession } from "@/lib/queries/schedule-sessions";
import {
  validateSessionInput,
  type RawSessionInput,
} from "./session-input";

export async function updateSessionAction(
  coachId: string,
  sessionId: string,
  raw: RawSessionInput,
): Promise<{ error?: string }> {
  if (!coachId || !sessionId) return { error: "Сессия не найдена." };
  const program = raw.program_id ? await getProgram(raw.program_id) : null;
  const v = validateSessionInput(raw, program);
  if (!v.ok) return { error: v.error };

  try {
    await updateSession(sessionId, v.value);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось сохранить сессию.",
    };
  }

  revalidatePath(`/ops/coaches/${coachId}`);
  revalidatePath("/ops/coaches");
  return {};
}
