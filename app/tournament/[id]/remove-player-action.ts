"use server";

import { revalidatePath } from "next/cache";
import { deleteRegistrationWithPartner } from "@/lib/queries/registrations";
import { getServerDict } from "@/lib/i18n/server";

export async function removePlayerAction(input: {
  tournamentId: string;
  registrationId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteRegistrationWithPartner(input.registrationId);
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.remove_player_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}`,
    );
  }
  return {};
}
