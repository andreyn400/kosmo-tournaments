"use server";

import { revalidatePath } from "next/cache";
import { deleteDivision, getDivision } from "@/lib/queries/divisions";

export async function deleteDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  try {
    const div = await getDivision(input.divisionId);
    if (!div) return { error: "Дивизион не найден" };
    if (div.status === "in_progress" || div.status === "completed") {
      return {
        error:
          "Нельзя удалить дивизион, в котором уже есть матчи. Сбросьте статус или удалите весь турнир.",
      };
    }
    await deleteDivision(input.divisionId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось удалить: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath("/display");
  return {};
}
