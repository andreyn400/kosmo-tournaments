"use server";

import { revalidatePath } from "next/cache";
import {
  getBracketMatch,
  updateBracketMatch,
  type BracketMatchPatch,
} from "@/lib/queries/bracket-matches";
import {
  getLeagueSeason,
  updateFinalsConfig,
} from "@/lib/queries/league-seasons";
import {
  scoringGroup,
  setsWon,
  validateGamesScore,
  validatePointsScore,
  validateSetsScore,
  type SetsDetail,
} from "@/lib/scoring-systems";
import { advanceWinnerPatch } from "@/lib/finals-advance";
import { applyFinalsEloForMatch } from "@/lib/finals-elo";
import type { ScoringSystem } from "@/lib/types";

export interface SubmitBracketScoreInput {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  team1Score?: number;
  team2Score?: number;
  scoreDetail?: SetsDetail;
}

export async function submitBracketScoreAction(
  input: SubmitBracketScoreInput,
): Promise<{ error?: string }> {
  const match = await getBracketMatch(input.matchId);
  if (!match) return { error: "Матч не найден" };
  if (match.status === "bye") return { error: "У матча BYE нельзя изменить счёт" };
  if (!match.team1_player1_id || !match.team2_player1_id) {
    return { error: "Матч ещё не готов — ждём соперников" };
  }

  const group = scoringGroup(input.scoringSystem);

  let t1Score: number;
  let t2Score: number;
  let scoreDetail: SetsDetail | null = null;

  if (group === "sets") {
    if (!input.scoreDetail) return { error: "Введите счёт сетов" };
    const v = validateSetsScore(input.scoringSystem, input.scoreDetail);
    if (!v.ok) return { error: v.error };
    const [a, b] = setsWon(input.scoreDetail);
    t1Score = a;
    t2Score = b;
    scoreDetail = input.scoreDetail;
  } else {
    const a = input.team1Score;
    const b = input.team2Score;
    if (a == null || b == null) return { error: "Введите счёт для обеих команд" };
    const v =
      group === "points"
        ? validatePointsScore(input.scoringSystem, a, b)
        : validateGamesScore(input.scoringSystem, a, b);
    if (!v.ok) return { error: v.error };
    t1Score = a;
    t2Score = b;
  }

  if (t1Score === t2Score) {
    return { error: "В сетке не может быть ничьей" };
  }
  const winner: 1 | 2 = t1Score > t2Score ? 1 : 2;

  const wasAlreadyCompleted = match.status === "completed";

  const patch: BracketMatchPatch = {
    team1_score: t1Score,
    team2_score: t2Score,
    score_detail: scoreDetail,
    winner_team: winner,
    status: "completed",
  };

  try {
    await updateBracketMatch(match.id, patch);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сохранения счёта";
    return { error: msg };
  }

  const updated = { ...match, ...patch } as typeof match;
  const advance = advanceWinnerPatch(updated);
  if (advance) {
    try {
      await updateBracketMatch(advance.nextMatchId, advance.patch);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка продвижения победителя";
      return { error: msg };
    }
  }

  if (
    !wasAlreadyCompleted &&
    match.team1_player1_id &&
    match.team1_player2_id &&
    match.team2_player1_id &&
    match.team2_player2_id
  ) {
    try {
      await applyFinalsEloForMatch({
        tournamentId: input.tournamentId,
        team1PlayerIds: [match.team1_player1_id, match.team1_player2_id],
        team2PlayerIds: [match.team2_player1_id, match.team2_player2_id],
        winner,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка обновления ELO";
      return { error: `Счёт сохранён, но ELO не обновился: ${msg}` };
    }
  }

  if (!match.next_match_id) {
    const league = await getLeagueSeason(input.tournamentId);
    if (league) {
      const championIds = [
        winner === 1 ? match.team1_player1_id : match.team2_player1_id,
        winner === 1 ? match.team1_player2_id : match.team2_player2_id,
      ].filter((x): x is string => !!x);
      try {
        await updateFinalsConfig(league.id, {
          finals_status: "completed",
          finals_champion_player_ids: championIds,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка завершения финала";
        return { error: msg };
      }
    }
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath(`/tournament/${input.tournamentId}/finals`);
  return {};
}
