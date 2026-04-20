import type { TournamentStatus } from "./types";

export type BadgeTone =
  | "status-draft"
  | "status-registration"
  | "status-progress"
  | "status-completed";

export function statusTone(status: TournamentStatus): BadgeTone {
  switch (status) {
    case "draft":
      return "status-draft";
    case "registration_open":
      return "status-registration";
    case "in_progress":
      return "status-progress";
    case "completed":
      return "status-completed";
  }
}
