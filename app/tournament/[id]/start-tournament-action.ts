"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTournament } from "@/lib/queries/tournaments";
import { listRegistrations } from "@/lib/queries/registrations";
import { startTournament } from "@/lib/start-tournament";
import type { Pair } from "@/lib/algorithms/teamAmericano";

export async function startTournamentAction(
  tournamentId: string,
): Promise<{ error?: string }> {
  const tournament = await getTournament(tournamentId);
  if (!tournament) return { error: "Турнир не найден" };
  if (tournament.status !== "registration_open")
    return { error: "Турнир нельзя запустить в текущем статусе" };

  const registrations = await listRegistrations(tournamentId);
  const playerIds = registrations.map((r) => r.player_id);

  const isTeamFormat =
    tournament.format === "team_americano" ||
    tournament.format === "team_mexicano";

  let pairs: Pair[] | undefined;
  if (isTeamFormat) {
    const result = buildPairsFromRegistrations(registrations);
    if (result.error) return { error: result.error };
    pairs = result.pairs;
  }

  try {
    await startTournament(tournament, playerIds, pairs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: msg };
  }

  revalidatePath(`/tournament/${tournamentId}`);
  revalidatePath("/");
  redirect(`/tournament/${tournamentId}/play`);
}

function buildPairsFromRegistrations(
  registrations: Array<{ player_id: string; partner_id: string | null }>,
): { pairs?: Pair[]; error?: string } {
  const pairs: Pair[] = [];
  const consumed = new Set<string>();
  const byPlayer = new Map(
    registrations.map((r) => [r.player_id, r] as const),
  );

  for (const r of registrations) {
    if (consumed.has(r.player_id)) continue;
    if (!r.partner_id) {
      return {
        error: "У некоторых игроков не указан партнёр — не удалось собрать пары",
      };
    }
    const partner = byPlayer.get(r.partner_id);
    if (!partner) {
      return { error: "Партнёр одного из игроков не зарегистрирован" };
    }
    if (partner.partner_id !== r.player_id) {
      return { error: "Парные регистрации не согласованы" };
    }
    pairs.push([r.player_id, r.partner_id]);
    consumed.add(r.player_id);
    consumed.add(r.partner_id);
  }

  return { pairs };
}
