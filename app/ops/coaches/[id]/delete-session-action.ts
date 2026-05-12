"use server";

import { revalidatePath } from "next/cache";
import { deleteSession } from "@/lib/queries/schedule-sessions";

export async function deleteSessionAction(
  coachId: string,
  sessionId: string,
): Promise<{ error?: string }> {
  if (!coachId || !sessionId) return { error: "Сессия не найдена." };
  try {
    await deleteSession(sessionId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить сессию.",
    };
  }
  revalidatePath(`/ops/coaches/${coachId}`);
  revalidatePath("/ops/coaches");
  return {};
}
