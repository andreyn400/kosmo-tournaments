"use server";

import { revalidatePath } from "next/cache";
import { deleteRegistrationWithPartner } from "@/lib/queries/registrations";

export async function removePlayerAction(input: {
  tournamentId: string;
  registrationId: string;
}): Promise<{ error?: string }> {
  try {
    await deleteRegistrationWithPartner(input.registrationId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось удалить игрока: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
