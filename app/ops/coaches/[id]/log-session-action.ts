"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { createSessionWithCoach } from "@/lib/queries/schedule-sessions";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import {
  validateSessionInput,
  type RawSessionInput,
} from "./session-input";

export async function logSessionAction(
  coachId: string,
  raw: RawSessionInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  if (!coachId) return { error: dict["error.not_found.coach"] };

  const program = raw.program_id ? await getProgram(raw.program_id) : null;
  const v = validateSessionInput(raw, program);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    const id = await createSessionWithCoach(v.value, coachId);
    revalidatePath(`/ops/coaches/${coachId}`);
    revalidatePath("/ops/coaches");
    return { id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.log_session"],
    };
  }
}
