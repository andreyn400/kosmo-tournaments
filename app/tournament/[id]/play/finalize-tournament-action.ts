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
      redirect(`/tournament/${tournamentId}`);
    }

    await finalizeTournamentElo(tournamentId);
    await updateTournamentStatus(tournamentId, "completed");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось завершить: ${msg}` };
  }

  revalidatePath("/");
  revalidatePath(`/tournament/${tournamentId}`);
  revalidatePath(`/tournament/${tournamentId}/play`);
  redirect(`/tournament/${tournamentId}/results`);
}

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
