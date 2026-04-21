"use server";

import { revalidatePath } from "next/cache";
import { deleteRegistrationWithPartner } from "@/lib/queries/registrations";

export async function removePlayerAction(input: {
  tournamentId: string;
  registrationId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  try {
    await deleteRegistrationWithPartner(input.registrationId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось удалить игрока: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}`,
    );
  }
  return {};
}
