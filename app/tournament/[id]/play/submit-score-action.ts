"use server";

import { revalidatePath } from "next/cache";
import { updateMatchScore } from "@/lib/queries/matches";
import {
  scoringGroup,
  setsWon,
  validateCombinedScore,
  validateGamesScore,
  validatePointsScore,
  validateSetsScore,
  type SetsDetail,
} from "@/lib/scoring-systems";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import type { ScoringSystem } from "@/lib/types";

export interface SubmitScoreInput {
  tournamentId: string;
  matchId: string;
  scoringSystem: ScoringSystem;
  team1Score?: number;
  team2Score?: number;
  scoreDetail?: SetsDetail;
  divisionId?: string | null;
}

export async function submitScoreAction(
  input: SubmitScoreInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const group = scoringGroup(input.scoringSystem);

  try {
    if (group === "sets") {
      if (!input.scoreDetail) return { error: dict["error.score.sets_required"] };
      const v = validateSetsScore(input.scoringSystem, input.scoreDetail);
      if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
      const [t1, t2] = setsWon(input.scoreDetail);
      await updateMatchScore({
        id: input.matchId,
        team1_score: t1,
        team2_score: t2,
        score_detail: input.scoreDetail,
      });
    } else {
      const a = input.team1Score;
      const b = input.team2Score;
      if (a == null || b == null)
        return { error: dict["error.score.both_teams_required"] };
      const validator =
        group === "points"
          ? validatePointsScore
          : group === "combined"
            ? validateCombinedScore
            : validateGamesScore;
      const v = validator(input.scoringSystem, a, b);
      if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
      await updateMatchScore({
        id: input.matchId,
        team1_score: a,
        team2_score: b,
        score_detail: null,
      });
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: `${dict["error.failed.save_score"]}: ${reason}`,
    };
  }

  revalidatePath(`/tournament/${input.tournamentId}/play`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}/play`,
    );
  }
  return {};
}
