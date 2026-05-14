"use server";

import { revalidatePath } from "next/cache";
import { deleteSession } from "@/lib/queries/schedule-sessions";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteSessionAction(
  coachId: string,
  sessionId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!coachId || !sessionId) return { error: dict["error.not_found.session"] };
  try {
    await deleteSession(sessionId);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.session"],
    };
  }
  revalidatePath(`/ops/coaches/${coachId}`);
  revalidatePath("/ops/coaches");
  return {};
}
