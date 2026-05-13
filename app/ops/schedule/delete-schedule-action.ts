"use server";

import { revalidatePath } from "next/cache";
import { deleteSession } from "@/lib/queries/schedule-sessions";

export async function deleteScheduleAction(
  sessionId: string,
): Promise<{ error?: string }> {
  try {
    await deleteSession(sessionId);
    revalidatePath("/ops/schedule");
    revalidatePath("/ops/coaches");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить сессию.",
    };
  }
}
