"use server";

import { revalidatePath } from "next/cache";
import {
  createRegistration,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";
import { getServerDict } from "@/lib/i18n/server";

export async function addPlayerAction(input: {
  tournamentId: string;
  playerId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    if (input.divisionId) {
      const div = await getDivision(input.divisionId);
      if (!div) return { error: dict["error.not_found.division"] };
      if (div.max_players) {
        const existing = await listRegistrationsByDivision(input.divisionId);
        if (existing.length >= div.max_players) {
          return {
            error: dict["error.division.players_limit_reached"].replace(
              "{limit}",
              String(div.max_players),
            ),
          };
        }
      }
    }
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: input.playerId,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.add_player_with_reason"].replace(
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
