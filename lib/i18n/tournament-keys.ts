import type { TranslationKey } from "@/lib/i18n";
import type { TournamentFormat, TournamentStatus } from "@/lib/types";

export const TOURNAMENT_STATUS_KEY: Record<TournamentStatus, TranslationKey> = {
  draft: "tournament.status.draft",
  registration_open: "tournament.status.registration_open",
  in_progress: "tournament.status.in_progress",
  completed: "tournament.status.completed",
};

export const TOURNAMENT_FORMAT_KEY: Record<TournamentFormat, TranslationKey> = {
  americano: "tournament.format.americano",
  team_americano: "tournament.format.team_americano",
  mexicano: "tournament.format.mexicano",
  team_mexicano: "tournament.format.team_mexicano",
  round_robin: "tournament.format.round_robin",
  escalera: "tournament.format.escalera",
};
