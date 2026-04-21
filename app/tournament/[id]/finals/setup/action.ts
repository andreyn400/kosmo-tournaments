"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getLeagueSeason,
  updateFinalsConfig,
} from "@/lib/queries/league-seasons";
import { getTournament } from "@/lib/queries/tournaments";
import { listSessionsByTournament } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { listPlayers } from "@/lib/queries/players";
import { listRoundsBySession } from "@/lib/queries/rounds";
import { listMatchesByRound } from "@/lib/queries/matches";
import {
  createBracketMatches,
  updateBracketMatch,
  type BracketMatchInsert,
} from "@/lib/queries/bracket-matches";
import { computeSeasonLeaderboard } from "@/lib/season-leaderboard";
import { computeQualification } from "@/lib/finals-qualification";
import {
  generateBracketPlan,
  type QualifiedPair,
} from "@/lib/finals-bracket";
import {
  isBracketSize,
  type BracketSize,
} from "@/lib/finals-seeding";
import { SCORING_SYSTEMS } from "@/lib/scoring-systems";
import { normalizeTime } from "@/lib/time-slots";
import type { Match, ScoringSystem } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildScheduledAt(
  scheduledDate: string | null,
  startTime: string | null,
): string | null {
  if (!scheduledDate || !DATE_RE.test(scheduledDate)) return null;
  const time = normalizeTime(startTime) ?? "12:00";
  const d = new Date(`${scheduledDate}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export interface CreateFinalsInput {
  tournamentId: string;
  bracketSize: number;
  scoringSystem: string;
  scheduledDate: string | null;
  startTime: string | null;
  courtIds: string[];
  individualPairs?: Array<{ player1_id: string; player2_id: string }>;
}

export async function createFinalsAction(
  input: CreateFinalsInput,
): Promise<{ error?: string }> {
  let result: { error?: string };
  try {
    result = await createFinalsActionInner(input);
  } catch (e) {
    console.error("[createFinalsAction] unhandled error", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Внутренняя ошибка: ${msg}` };
  }
  if (result.error) return result;
  redirect(`/tournament/${input.tournamentId}/finals`);
}

async function createFinalsActionInner(
  input: CreateFinalsInput,
): Promise<{ error?: string }> {
  if (!isBracketSize(input.bracketSize)) {
    return { error: "Неверный размер сетки" };
  }
  if (!SCORING_SYSTEMS.includes(input.scoringSystem as ScoringSystem)) {
    return { error: "Неверная система счёта" };
  }
  const bracketSize = input.bracketSize as BracketSize;
  const scoringSystem = input.scoringSystem as ScoringSystem;

  const tournament = await getTournament(input.tournamentId);
  if (!tournament) return { error: "Турнир не найден" };
  if (tournament.type !== "league_season") {
    return { error: "Финалы доступны только для сезонных лиг" };
  }

  const league = await getLeagueSeason(input.tournamentId);
  if (!league) return { error: "Сезон лиги не найден" };
  if (league.finals_status !== "not_created") {
    return { error: "Финальная сетка уже создана" };
  }

  const sessions = await listSessionsByTournament(input.tournamentId);
  if (sessions.length === 0 || sessions.some((s) => s.status !== "completed")) {
    return { error: "Сначала завершите все сессии лиги" };
  }

  const [registrations, players] = await Promise.all([
    listRegistrations(input.tournamentId),
    listPlayers(),
  ]);

  const sessionInputs = await Promise.all(
    sessions.map(async (s) => {
      const rounds = await listRoundsBySession(s.id);
      const matchLists = await Promise.all(
        rounds.map((r) => listMatchesByRound(r.id)),
      );
      return {
        session: s,
        matches: matchLists.flat() as Match[],
        registrations: registrations.map((r) => ({
          player_id: r.player_id,
          partner_id: r.partner_id,
        })),
      };
    }),
  );

  const leaderboard = computeSeasonLeaderboard(
    tournament,
    sessionInputs,
    players,
    league.points_table,
    league.qualification_spots,
  );

  const qualification = computeQualification({
    format: tournament.format,
    leaderboard,
    registrations: registrations.map((r) => ({
      player_id: r.player_id,
      partner_id: r.partner_id,
    })),
    players,
  });

  let qualifiedPairs: QualifiedPair[];
  if (qualification.kind === "team") {
    if (qualification.pairs.length < bracketSize / 2) {
      return {
        error: `Нужно минимум ${bracketSize / 2} пар, квалифицировано ${qualification.pairs.length}`,
      };
    }
    qualifiedPairs = qualification.pairs.slice(0, bracketSize);
  } else {
    const needed = bracketSize * 2;
    if (qualification.individuals.length < needed) {
      return {
        error: `Нужно минимум ${needed} квалифицированных игроков, найдено ${qualification.individuals.length}`,
      };
    }
    const clientPairs = input.individualPairs ?? [];
    if (clientPairs.length !== bracketSize) {
      return { error: `Нужно сформировать ${bracketSize} пар для финалов` };
    }
    const seenIds = new Set<string>();
    for (const cp of clientPairs) {
      if (!cp.player1_id || !cp.player2_id || cp.player1_id === cp.player2_id) {
        return { error: "Неверная пара (совпадают игроки)" };
      }
      if (seenIds.has(cp.player1_id) || seenIds.has(cp.player2_id)) {
        return { error: "Игрок использован дважды в составах пар" };
      }
      seenIds.add(cp.player1_id);
      seenIds.add(cp.player2_id);
    }
    const qualifiedIds = new Set(
      qualification.individuals.slice(0, needed).map((i) => i.playerId),
    );
    for (const cp of clientPairs) {
      if (!qualifiedIds.has(cp.player1_id) || !qualifiedIds.has(cp.player2_id)) {
        return { error: "Пара содержит неквалифицированного игрока" };
      }
    }
    const pairSeedFor = (a: string, b: string) => {
      const ra =
        qualification.individuals.find((i) => i.playerId === a)?.seed ??
        Number.MAX_SAFE_INTEGER;
      const rb =
        qualification.individuals.find((i) => i.playerId === b)?.seed ??
        Number.MAX_SAFE_INTEGER;
      return Math.min(ra, rb);
    };
    const sortedClientPairs = [...clientPairs].sort(
      (a, b) =>
        pairSeedFor(a.player1_id, a.player2_id) -
        pairSeedFor(b.player1_id, b.player2_id),
    );
    qualifiedPairs = sortedClientPairs.map((p, idx) => ({
      pairSeed: idx + 1,
      player1_id: p.player1_id,
      player2_id: p.player2_id,
    }));
  }

  let plan;
  try {
    plan = generateBracketPlan({ bracketSize, qualifiedPairs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка генерации сетки";
    return { error: msg };
  }

  const scheduledAt = buildScheduledAt(input.scheduledDate, input.startTime);

  const rowsToInsert: BracketMatchInsert[] = plan.map((m) => ({
    tournament_id: input.tournamentId,
    league_season_id: league.id,
    round_number: m.round_number,
    position: m.position,
    seed1: m.seed1,
    seed2: m.seed2,
    team1_player1_id: m.team1_player1_id,
    team1_player2_id: m.team1_player2_id,
    team2_player1_id: m.team2_player1_id,
    team2_player2_id: m.team2_player2_id,
    scheduled_at: scheduledAt,
    status: m.status,
  }));

  let inserted;
  try {
    inserted = await createBracketMatches(rowsToInsert);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка создания матчей";
    return { error: msg };
  }

  const realIdByKey = new Map<string, string>();
  for (const row of inserted) {
    realIdByKey.set(`r${row.round_number}_p${row.position}`, row.id);
  }

  const finalWinnerPairBySeed = new Map<string, QualifiedPair>();
  for (const p of qualifiedPairs) finalWinnerPairBySeed.set(p.player1_id, p);

  for (const planned of plan) {
    const realId = realIdByKey.get(planned.tempId);
    if (!realId) continue;
    const patch: Parameters<typeof updateBracketMatch>[1] = {};
    if (planned.nextTempId && planned.nextTempSlot) {
      patch.next_match_id = realIdByKey.get(planned.nextTempId) ?? null;
      patch.next_match_slot = planned.nextTempSlot;
    }
    if (planned.status === "bye") {
      patch.winner_team = planned.winner_team;
    }
    if (input.courtIds.length > 0 && planned.round_number === 1) {
      const idx = planned.position % input.courtIds.length;
      patch.court_id = input.courtIds[idx];
    }
    if (Object.keys(patch).length > 0) {
      await updateBracketMatch(realId, patch);
    }
  }

  try {
    await updateFinalsConfig(league.id, {
      finals_bracket_size: bracketSize,
      finals_scoring_system: scoringSystem,
      finals_status: "in_progress",
      finals_date: input.scheduledDate ?? league.finals_date,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сохранения конфига финала";
    return { error: msg };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath(`/tournament/${input.tournamentId}/finals`);
  return {};
}
