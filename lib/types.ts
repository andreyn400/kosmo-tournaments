export type PadelLevel =
  | "D"
  | "D+"
  | "C-"
  | "C"
  | "C+"
  | "B-"
  | "B"
  | "B+"
  | "A"
  | "OPEN";

export type TournamentType = "one_day" | "league_season";

export type TournamentFormat =
  | "americano"
  | "team_americano"
  | "mexicano"
  | "team_mexicano"
  | "round_robin"
  | "escalera";

export type TournamentStatus =
  | "draft"
  | "registration_open"
  | "in_progress"
  | "completed";

export type RegistrationStatus = "registered" | "waitlist" | "cancelled";

export type SessionStatus = "scheduled" | "in_progress" | "completed";

export type RoundStatus = "pending" | "in_progress" | "completed";

export type MatchStatus = "pending" | "completed";

export type CourtSurface =
  | "artificial_grass"
  | "grass"
  | "concrete"
  | "carpet";

export type CourtStatus = "active" | "maintenance";

export type Gender = "male" | "female" | "other";

export type MembershipStatus = "member" | "non_member" | "guest";

export type DominantHand = "right" | "left";

export type DivisionCategory = "mens" | "womens" | "mixed" | "open";

export type DivisionStatus =
  | "draft"
  | "registration_open"
  | "in_progress"
  | "completed";

export type ScoringSystem =
  | "points_16"
  | "points_21"
  | "points_32"
  | "games_16"
  | "games_24"
  | "games_32"
  | "combined_21"
  | "combined_32"
  | "combined_42"
  | "sets_best3"
  | "sets_supertiebreak";

export interface Court {
  id: string;
  name: string;
  number: number;
  surface: CourtSurface;
  status: CourtStatus;
  notes: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  level: PadelLevel;
  elo_rating: number;
  notes: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  nationality: string | null;
  photo_url: string | null;
  membership_status: MembershipStatus;
  dominant_hand: DominantHand | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  date_start: string;
  date_end: string | null;
  level_min: PadelLevel | null;
  level_max: PadelLevel | null;
  max_players: number | null;
  courts: number[];
  court_ids: string[];
  start_time: string | null;
  scoring_system: ScoringSystem;
  duration_hours: number;
  entry_fee: number;
  prize_description: string | null;
  notes: string | null;
  created_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  division_id: string | null;
  player_id: string;
  partner_id: string | null;
  status: RegistrationStatus;
  registered_at: string;
}

export interface Division {
  id: string;
  tournament_id: string;
  name: string;
  category: DivisionCategory;
  level_min: PadelLevel | null;
  level_max: PadelLevel | null;
  max_players: number | null;
  court_ids: string[];
  format: TournamentFormat;
  scoring_system: ScoringSystem;
  status: DivisionStatus;
  created_at: string;
}

export interface TournamentSession {
  id: string;
  tournament_id: string;
  session_date: string;
  session_number: number;
  status: SessionStatus;
  start_time: string | null;
}

export interface Round {
  id: string;
  session_id: string;
  division_id: string | null;
  round_number: number;
  status: RoundStatus;
}

export interface Match {
  id: string;
  round_id: string;
  division_id: string | null;
  court_number: number | null;
  court_id: string | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  score_detail: unknown | null;
  status: MatchStatus;
  created_at: string;
}

export interface SeasonLeaderboardRow {
  id: string;
  tournament_id: string;
  player_id: string;
  total_points: number;
  sessions_played: number;
  best_position: number | null;
  qualified: boolean;
}

export type BracketMatchStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "bye";

export type FinalsStatus = "not_created" | "in_progress" | "completed";

export interface BracketMatch {
  id: string;
  tournament_id: string;
  league_season_id: string;
  round_number: number;
  position: number;
  seed1: number | null;
  seed2: number | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  score_detail: unknown | null;
  winner_team: 1 | 2 | null;
  next_match_id: string | null;
  next_match_slot: 1 | 2 | null;
  court_id: string | null;
  scheduled_at: string | null;
  status: BracketMatchStatus;
  created_at: string;
}

export interface RatingHistoryEntry {
  id: string;
  player_id: string;
  tournament_id: string | null;
  session_id: string | null;
  elo_before: number;
  elo_after: number;
  change: number;
  recorded_at: string;
}

// ── Phase 10 — Operations ────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  type: string;
  duration_minutes: number;
  price_peak_rub: number;
  price_offpeak_rub: number;
  courts_needed: number;
  max_players: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type ProgramInput = Omit<Program, "id" | "created_at">;

export type CoachRateType = "flat" | "percent";

export interface Coach {
  id: string;
  name: string;
  phone: string | null;
  specialization: string | null;
  level: string | null;
  bio: string | null;
  photo_url: string | null;
  color: string;
  rate_type: CoachRateType;
  flat_rate_rub: number;
  rate_court_percent: number;
  rate_coaching_percent: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export type CoachInput = Omit<Coach, "id" | "created_at">;

export interface CoachAvailability {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AvailabilityWindow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export type ScheduleSessionStatus = "scheduled" | "completed" | "cancelled";

export interface ScheduleSession {
  id: string;
  program_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  attendee_count: number;
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
  is_peak: boolean;
  notes: string | null;
  source: string;
  status: ScheduleSessionStatus;
  created_at: string;
}

export interface ScheduleSessionWithMeta extends ScheduleSession {
  program_name: string | null;
  program_type: string | null;
}

export interface SessionInput {
  program_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  court_ids: string[];
  attendee_count: number;
  revenue_rub: number;
  court_revenue_rub: number;
  coaching_fee_rub: number;
  is_peak: boolean;
  notes: string | null;
  source: string;
  status: ScheduleSessionStatus;
}

// ── Organizer accounts ──────────────────────────────────────────────────

export interface Organizer {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export type OrganizerInput = Omit<Organizer, "id" | "created_at">;

/**
 * Ledger entry types:
 *  - payment: charge for court rental / event hosting (increases what organizer owes)
 *  - deposit: cash received from organizer (decreases what they owe)
 *  - refund:  refund issued back to organizer (decreases what they owe)
 *
 * Balance convention: positive balance = organizer owes the club.
 *   balance = SUM(payment) − SUM(deposit) − SUM(refund)
 */
export type OrganizerPaymentType = "payment" | "deposit" | "refund";

export interface OrganizerPayment {
  id: string;
  organizer_id: string;
  date: string;
  amount_rub: number;
  type: OrganizerPaymentType;
  courts_booked: number | null;
  hours_booked: number | null;
  notes: string | null;
  created_at: string;
}

export type OrganizerPaymentInput = Omit<
  OrganizerPayment,
  "id" | "created_at"
>;

export interface OrganizerWithBalance extends Organizer {
  balance_rub: number;
  charges_total: number;
  deposits_total: number;
  refunds_total: number;
  entries_count: number;
  last_activity: string | null;
}
