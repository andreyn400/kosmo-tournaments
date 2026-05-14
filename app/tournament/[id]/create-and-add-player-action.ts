"use server";

import { revalidatePath } from "next/cache";
import { createPlayer } from "@/lib/queries/players";
import {
  createRegistration,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";
import { PADEL_LEVELS } from "@/lib/constants";
import { getServerDict } from "@/lib/i18n/server";
import type { PadelLevel } from "@/lib/types";

export async function createAndAddPlayerAction(input: {
  tournamentId: string;
  name: string;
  level: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const name = input.name.trim();
  if (!name) return { error: dict["error.required.player_name"] };
  if (!(PADEL_LEVELS as string[]).includes(input.level))
    return { error: dict["error.invalid.level_unknown"] };

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
    const player = await createPlayer({
      name,
      level: input.level as PadelLevel,
    });
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: player.id,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.create.player_with_reason"].replace(
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
