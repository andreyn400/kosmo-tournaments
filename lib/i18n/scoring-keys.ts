import type { TranslationKey } from "@/lib/i18n";
import type { DivisionCategory, ScoringSystem } from "@/lib/types";
import type { ScoringGroup } from "@/lib/scoring-systems";

export const SCORING_SYSTEM_LABEL_KEY: Record<ScoringSystem, TranslationKey> = {
  points_16: "scoring.system.points_16",
  points_21: "scoring.system.points_21",
  points_32: "scoring.system.points_32",
  games_16: "scoring.system.games_16",
  games_24: "scoring.system.games_24",
  games_32: "scoring.system.games_32",
  combined_21: "scoring.system.combined_21",
  combined_32: "scoring.system.combined_32",
  combined_42: "scoring.system.combined_42",
  sets_best3: "scoring.system.sets_best3",
  sets_supertiebreak: "scoring.system.sets_supertiebreak",
};

export const SCORING_SYSTEM_HELPER_KEY: Record<ScoringSystem, TranslationKey> = {
  points_16: "scoring.helper.points_16",
  points_21: "scoring.helper.points_21",
  points_32: "scoring.helper.points_32",
  games_16: "scoring.helper.games_16",
  games_24: "scoring.helper.games_24",
  games_32: "scoring.helper.games_32",
  combined_21: "scoring.helper.combined_21",
  combined_32: "scoring.helper.combined_32",
  combined_42: "scoring.helper.combined_42",
  sets_best3: "scoring.helper.sets_best3",
  sets_supertiebreak: "scoring.helper.sets_supertiebreak",
};

export const SCORING_GROUP_LABEL_KEY: Record<ScoringGroup, TranslationKey> = {
  points: "scoring.group.points",
  games: "scoring.group.games",
  combined: "scoring.group.combined",
  sets: "scoring.group.sets",
};

export const DIVISION_CATEGORY_KEY: Record<DivisionCategory, TranslationKey> = {
  mens: "division.category.mens",
  womens: "division.category.womens",
  mixed: "division.category.mixed",
  open: "division.category.open",
};
