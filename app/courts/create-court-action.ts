"use server";

import { revalidatePath } from "next/cache";
import { createCourt } from "@/lib/queries/courts";
import type { CourtStatus, CourtSurface } from "@/lib/types";
import { COURT_STATUS_LABEL_RU, COURT_SURFACE_LABEL_RU } from "@/lib/constants";

export async function createCourtAction(input: {
  name: string;
  number: number;
  surface: string;
  status: string;
  notes: string;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Введите название корта." };
  if (!Number.isInteger(input.number) || input.number < 1 || input.number > 10) {
    return { error: "Номер корта должен быть от 1 до 10." };
  }
  if (!(input.surface in COURT_SURFACE_LABEL_RU)) {
    return { error: "Неверное покрытие." };
  }
  if (!(input.status in COURT_STATUS_LABEL_RU)) {
    return { error: "Неверный статус." };
  }

  try {
    await createCourt({
      name,
      number: input.number,
      surface: input.surface as CourtSurface,
      status: input.status as CourtStatus,
      notes: input.notes.trim() || null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось создать корт." };
  }

  revalidatePath("/courts");
  revalidatePath("/tournament/new");
  revalidatePath("/league/new");
  return {};
}
