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

export async function finalizeTournamentAction(
  tournamentId: string,
): Promise<{ error?: string }> {
  let redirectPath: string | null = null;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return { error: "Турнир не найден" };

    if (tournament.type === "league_season") {
      const sessions = await listSessionsByTournament(tournamentId);
      const active = sessions.find((s) => s.status === "in_progress");
      if (!active) return { error: "Нет активной сессии" };

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
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось завершить: ${msg}` };
  }

  redirect(redirectPath);
}
