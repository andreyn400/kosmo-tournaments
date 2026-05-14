"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { finalizeTournamentElo } from "@/lib/tournament-elo";
import { finalizeSessionElo } from "@/lib/session-finalization";
import {
  getTournament,
  updateTournamentStatus,
} from "@/lib/queries/tournaments";
import {
  listSessionsByTournament,
  updateSessionStatus,
} from "@/lib/queries/sessions";
import { getServerDict } from "@/lib/i18n/server";

export async function finalizeTournamentAction(
  tournamentId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  let redirectPath: string | null = null;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return { error: dict["error.not_found.tournament"] };

    if (tournament.type === "league_season") {
      const sessions = await listSessionsByTournament(tournamentId);
      const active = sessions.find((s) => s.status === "in_progress");
      if (!active) return { error: dict["error.state.no_active_session"] };

      await finalizeSessionElo({
        sessionId: active.id,
        tournamentId,
      });
      await updateSessionStatus(active.id, "completed");

      revalidatePath("/");
      revalidatePath(`/tournament/${tournamentId}`);
      revalidatePath(`/tournament/${tournamentId}/play`);
      revalidatePath(`/tournament/${tournamentId}/season`);
      redirectPath = `/tournament/${tournamentId}`;
    } else {
      await finalizeTournamentElo(tournamentId);
      await updateTournamentStatus(tournamentId, "completed");
      revalidatePath("/");
      revalidatePath(`/tournament/${tournamentId}`);
      revalidatePath(`/tournament/${tournamentId}/play`);
      redirectPath = `/tournament/${tournamentId}/results`;
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.finalize_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  redirect(redirectPath);
}
