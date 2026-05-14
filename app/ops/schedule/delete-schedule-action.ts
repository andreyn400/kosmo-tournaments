"use server";

import { revalidatePath } from "next/cache";
import { deleteSession } from "@/lib/queries/schedule-sessions";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteScheduleAction(
  sessionId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteSession(sessionId);
    revalidatePath("/ops/schedule");
    revalidatePath("/ops/coaches");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.session"],
    };
  }
}
