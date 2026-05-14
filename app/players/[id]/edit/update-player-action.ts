"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updatePlayer } from "@/lib/queries/players";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import type { PlayerFormValues } from "../../PlayerFields";
import { parsePlayerForm } from "../../parse-player-form";

export async function updatePlayerAction(
  id: string,
  input: PlayerFormValues,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const parsed = parsePlayerForm(input);
  if ("error" in parsed) {
    return { error: resolveErrorWithDict(parsed.error, dict) };
  }

  try {
    await updatePlayer(id, parsed.value);
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.save.player_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}`);
}
