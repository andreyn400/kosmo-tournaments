"use server";

import { revalidatePath } from "next/cache";
import { getProgram } from "@/lib/queries/programs";
import { updateSession } from "@/lib/queries/schedule-sessions";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import {
  validateSessionInput,
  type RawSessionInput,
} from "./session-input";

export async function updateSessionAction(
  coachId: string,
  sessionId: string,
  raw: RawSessionInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!coachId || !sessionId) return { error: dict["error.not_found.session"] };
  const program = raw.program_id ? await getProgram(raw.program_id) : null;
  const v = validateSessionInput(raw, program);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await updateSession(sessionId, v.value);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.save.session"],
    };
  }

  revalidatePath(`/ops/coaches/${coachId}`);
  revalidatePath("/ops/coaches");
  return {};
}
