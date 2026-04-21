"use server";

import { revalidatePath } from "next/cache";
import { listDivisions, updateDivision } from "@/lib/queries/divisions";
import { listCourtsByIds } from "@/lib/queries/courts";
import { PADEL_LEVELS } from "@/lib/constants";
import { SCORING_SYSTEMS } from "@/lib/scoring-systems";
import type {
  DivisionCategory,
  PadelLevel,
  ScoringSystem,
  TournamentFormat,
} from "@/lib/types";

const CATEGORIES: DivisionCategory[] = ["mens", "womens", "mixed", "open"];

const FORMATS: TournamentFormat[] = [
  "americano",
  "team_americano",
  "mexicano",
  "team_mexicano",
  "round_robin",
  "escalera",
];

export interface UpdateDivisionInput {
  tournamentId: string;
  divisionId: string;
  name: string;
  category: string;
  format: string;
  scoring_system: string;
  level_min: string | null;
  level_max: string | null;
  max_players: number | null;
  court_ids: string[];
}

export async function updateDivisionAction(
  input: UpdateDivisionInput,
): Promise<{ error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Введите название дивизиона" };
  if (!CATEGORIES.includes(input.category as DivisionCategory))
    return { error: "Неизвестная категория" };
  if (!FORMATS.includes(input.format as TournamentFormat))
    return { error: "Неизвестный формат" };
  if (!SCORING_SYSTEMS.includes(input.scoring_system as ScoringSystem))
    return { error: "Неизвестная система счёта" };
  if (input.max_players != null && input.max_players < 4)
    return { error: "Минимум 4 игрока" };
  if (input.max_players != null && input.max_players % 4 !== 0)
    return { error: "Число игроков должно быть кратно 4" };
  if (input.court_ids.length === 0)
    return { error: "Выберите хотя бы один корт" };

  const level_min =
    input.level_min && (PADEL_LEVELS as string[]).includes(input.level_min)
      ? (input.level_min as PadelLevel)
      : null;
  const level_max =
    input.level_max && (PADEL_LEVELS as string[]).includes(input.level_max)
      ? (input.level_max as PadelLevel)
      : null;

  const siblings = await listDivisions(input.tournamentId);
  const courtIdSet = new Set(input.court_ids);
  const conflicting = siblings.find(
    (d) =>
      d.id !== input.divisionId &&
      d.status === "in_progress" &&
      d.court_ids.some((cid) => courtIdSet.has(cid)),
  );
  if (conflicting) {
    const sharedIds = conflicting.court_ids.filter((cid) => courtIdSet.has(cid));
    const courts = await listCourtsByIds(sharedIds);
    const courtLabel =
      courts.length > 0
        ? `К${courts.map((c) => c.number).sort((a, b) => a - b).join(", К")}`
        : "один из кортов";
    return {
      error: `Конфликт кортов: ${courtLabel} уже используется дивизионом «${conflicting.name}» (идёт). Выберите другие корты.`,
    };
  }

  try {
    await updateDivision(input.divisionId, {
      name,
      category: input.category as DivisionCategory,
      level_min,
      level_max,
      max_players: input.max_players,
      court_ids: input.court_ids,
      format: input.format as TournamentFormat,
      scoring_system: input.scoring_system as ScoringSystem,
    });
    revalidatePath(`/tournament/${input.tournamentId}`);
    revalidatePath("/display");
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Ошибка сохранения: ${msg}` };
  }
}
