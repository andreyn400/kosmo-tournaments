"use server";

import { revalidatePath } from "next/cache";
import { replaceAvailability } from "@/lib/queries/coaches";
import type { AvailabilityWindow } from "@/lib/types";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function setAvailabilityAction(
  coachId: string,
  windows: AvailabilityWindow[],
): Promise<{ error?: string }> {
  if (!coachId) return { error: "Тренер не найден." };

  for (const w of windows) {
    if (!Number.isInteger(w.day_of_week) || w.day_of_week < 0 || w.day_of_week > 6) {
      return { error: "Неверный день недели." };
    }
    if (!TIME_RE.test(w.start_time) || !TIME_RE.test(w.end_time)) {
      return { error: "Время должно быть в формате ЧЧ:ММ." };
    }
    const [sh, sm] = w.start_time.split(":").map(Number);
    const [eh, em] = w.end_time.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      return { error: "Время окончания должно быть после начала." };
    }
  }

  try {
    await replaceAvailability(coachId, windows);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось сохранить расписание.",
    };
  }

  revalidatePath(`/ops/coaches/${coachId}`);
  return {};
}
