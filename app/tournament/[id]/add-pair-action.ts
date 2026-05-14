"use server";

import { revalidatePath } from "next/cache";
import {
  createRegistrationPair,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";
import { getServerDict } from "@/lib/i18n/server";

export async function addPairAction(input: {
  tournamentId: string;
  playerAId: string;
  playerBId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!input.playerAId || !input.playerBId) {
    return { error: dict["error.player.both_required"] };
  }
  if (input.playerAId === input.playerBId) {
    return { error: dict["error.player.self_pair"] };
  }
  try {
    if (input.divisionId) {
      const div = await getDivision(input.divisionId);
      if (!div) return { error: dict["error.not_found.division"] };
      if (div.max_players) {
        const existing = await listRegistrationsByDivision(input.divisionId);
        if (existing.length + 2 > div.max_players) {
          return {
            error: dict["error.division.pair_exceeds_limit"].replace(
              "{limit}",
              String(div.max_players),
            ),
          };
        }
      }
    }
    await createRegistrationPair({
      tournament_id: input.tournamentId,
      player_a: input.playerAId,
      player_b: input.playerBId,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.add_pair_with_reason"].replace(
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
