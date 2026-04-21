"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision, listDivisions } from "@/lib/queries/divisions";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { startDivision } from "@/lib/start-division";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import type { Pair } from "@/lib/algorithms/teamAmericano";

export async function startDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  const [tournament, division, siblingDivisions] = await Promise.all([
    getTournament(input.tournamentId),
    getDivision(input.divisionId),
    listDivisions(input.tournamentId),
  ]);
  if (!tournament) return { error: "Турнир не найден" };
  if (!division || division.tournament_id !== input.tournamentId) {
    return { error: "Дивизион не найден" };
  }
  if (division.status !== "draft" && division.status !== "registration_open") {
    return { error: "Дивизион нельзя запустить в текущем статусе" };
  }

  const courtIdSet = new Set(division.court_ids);
  const conflict = siblingDivisions.find(
    (d) =>
      d.id !== division.id &&
      d.status === "in_progress" &&
      d.court_ids.some((cid) => courtIdSet.has(cid)),
  );
  if (conflict) {
    return {
      error: `Невозможно запустить: корт уже используется дивизионом «${conflict.name}». Выберите другие корты для этого дивизиона.`,
    };
  }

  const registrations = await listRegistrationsByDivision(input.divisionId);
  const playerIds = registrations.map((r) => r.player_id);

  const isTeamFormat =
    division.format === "team_americano" ||
    division.format === "team_mexicano";

  let pairs: Pair[] | undefined;
  if (isTeamFormat) {
    pairs = pairsFromRegistrations(registrations);
    if (pairs.length !== playerIds.length / 2) {
      return {
        error: "У некоторых игроков нет партнёра — не удалось собрать пары",
      };
    }
  }

  try {
    await startDivision({ tournament, division, playerIds, pairs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: msg };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath(
    `/tournament/${input.tournamentId}/division/${input.divisionId}`,
  );
  revalidatePath("/");
  redirect(`/tournament/${input.tournamentId}/division/${input.divisionId}`);
}
