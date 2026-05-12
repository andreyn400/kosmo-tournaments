-- Kosmo Tournaments — Phase 1 schema
-- Run this in the Supabase SQL Editor.
-- After running: enable Realtime on `matches` and `rounds` (Table Editor → table → Replication tab).
-- RLS is intentionally left disabled for Phase 1 (single operator, no auth). Re-visit at Phase ≥3.

-- Players (global, not per-club)
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  level text check (level in ('D','D+','C-','C','C+','B-','B','B+','A','OPEN')) default 'C',
  elo_rating int default 1000,
  notes text,
  created_at timestamptz default now()
);

-- Tournaments
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('one_day','league_season')) not null default 'one_day',
  format text check (format in ('americano','team_americano','mexicano','team_mexicano','round_robin','escalera')) not null,
  status text check (status in ('draft','registration_open','in_progress','completed')) default 'draft',
  date_start date not null,
  date_end date,
  level_min text,
  level_max text,
  max_players int,
  courts jsonb default '[1,2,3,4,5]',
  entry_fee int default 0,
  prize_description text,
  notes text,
  created_at timestamptz default now()
);

-- League config (only for type=league_season)
create table league_seasons (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade unique,
  session_dates jsonb default '[]',
  points_table jsonb default '{"16":{"1":14,"2":12,"3":10,"4":8,"5":6,"6":4,"7":2,"8":1},"12":{"1":10,"2":8,"3":6,"4":4,"5":2,"6":1},"8":{"1":6,"2":4,"3":2,"4":1},"4":{"1":2,"2":1}}',
  qualification_spots int default 16,
  finals_date date
);

-- Registrations
create table tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  player_id uuid references players(id),
  partner_id uuid references players(id),
  status text check (status in ('registered','waitlist','cancelled')) default 'registered',
  registered_at timestamptz default now(),
  unique(tournament_id, player_id)
);

-- Sessions (each session = one day of play within a league, or the single day for one_day)
create table tournament_sessions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  session_date date not null,
  session_number int not null default 1,
  status text check (status in ('scheduled','in_progress','completed')) default 'scheduled'
);

-- Rounds within a session
create table rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references tournament_sessions(id) on delete cascade,
  round_number int not null,
  status text check (status in ('pending','in_progress','completed')) default 'pending'
);

-- Individual matches within a round
create table matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  court_number int,
  team1_player1_id uuid references players(id),
  team1_player2_id uuid references players(id),
  team2_player1_id uuid references players(id),
  team2_player2_id uuid references players(id),
  team1_score int,
  team2_score int,
  status text check (status in ('pending','completed')) default 'pending',
  created_at timestamptz default now()
);

-- Season leaderboard (cumulative across sessions for league_season type)
create table season_leaderboard (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  player_id uuid references players(id),
  total_points int default 0,
  sessions_played int default 0,
  best_position int,
  qualified boolean default false,
  unique(tournament_id, player_id)
);

-- ELO rating history
create table rating_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  tournament_id uuid references tournaments(id),
  session_id uuid references tournament_sessions(id),
  elo_before int not null,
  elo_after int not null,
  change int not null,
  recorded_at timestamptz default now()
);

-- ========================================
-- Phase 4 migrations (run as a separate step in Supabase SQL Editor)
-- ========================================

-- Phase 4A — Courts management
create table courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number int not null,
  surface text check (surface in ('artificial_grass','grass','concrete','carpet')) default 'artificial_grass',
  status text check (status in ('active','maintenance')) default 'active',
  notes text,
  created_at timestamptz default now()
);

alter table tournaments add column court_ids uuid[] default '{}';
alter table matches add column court_id uuid references courts(id);

-- Phase 4B — start_time on tournaments and sessions
alter table tournaments add column start_time time;
alter table tournament_sessions add column start_time time;

-- Phase 4C — scoring systems
alter table tournaments add column scoring_system text
  check (scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'sets_best3','sets_supertiebreak'
  ))
  default 'games_24';
alter table matches add column score_detail jsonb;

-- Phase 4D — calendar (duration for event blocks)
alter table tournaments
  add column duration_hours int not null default 2;
alter table tournaments
  add constraint duration_hours_range
  check (duration_hours between 1 and 12);

-- ========================================
-- Phase 6 migrations — extended player profile
-- ========================================

alter table players add column gender text check (gender in ('male','female','other'));
alter table players add column date_of_birth date;
alter table players add column nationality text;
alter table players add column photo_url text;
alter table players add column membership_status text
  check (membership_status in ('member','non_member','guest')) default 'guest';
alter table players add column dominant_hand text check (dominant_hand in ('right','left'));

-- ========================================
-- Phase 7 migrations — divisions within tournaments
-- ========================================

create table divisions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  category text check (category in ('mens','womens','mixed','open')) default 'open',
  level_min text,
  level_max text,
  max_players int,
  court_ids uuid[] default '{}',
  format text check (format in ('americano','team_americano','mexicano','team_mexicano','round_robin','escalera')),
  scoring_system text default 'games_24',
  status text check (status in ('draft','registration_open','in_progress','completed')) default 'draft',
  created_at timestamptz default now()
);

alter table tournament_registrations
  add column division_id uuid references divisions(id) on delete cascade;

alter table rounds
  add column division_id uuid references divisions(id) on delete cascade;

alter table matches
  add column division_id uuid references divisions(id) on delete cascade;

create index idx_tournament_registrations_division on tournament_registrations(division_id);
create index idx_rounds_division on rounds(division_id);
create index idx_matches_division on matches(division_id);

-- ========================================
-- Phase 8 migrations — finals bracket (single-elimination playoff)
-- ========================================

create table bracket_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  league_season_id uuid references league_seasons(id) on delete cascade,
  round_number int not null,
  position int not null,
  seed1 int,
  seed2 int,
  team1_player1_id uuid references players(id),
  team1_player2_id uuid references players(id),
  team2_player1_id uuid references players(id),
  team2_player2_id uuid references players(id),
  team1_score int,
  team2_score int,
  score_detail jsonb,
  winner_team int check (winner_team in (1, 2)),
  next_match_id uuid references bracket_matches(id) on delete set null,
  next_match_slot int check (next_match_slot in (1, 2)),
  court_id uuid references courts(id),
  scheduled_at timestamptz,
  status text check (status in ('pending','in_progress','completed','bye')) default 'pending',
  created_at timestamptz default now(),
  unique (league_season_id, round_number, position)
);

create index idx_bracket_matches_league on bracket_matches(league_season_id);
create index idx_bracket_matches_next on bracket_matches(next_match_id);

alter table league_seasons add column finals_bracket_size int;
alter table league_seasons add column finals_scoring_system text
  check (finals_scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'sets_best3','sets_supertiebreak'
  ));
alter table league_seasons add column finals_status text
  check (finals_status in ('not_created','in_progress','completed')) default 'not_created';
alter table league_seasons add column finals_champion_player_ids uuid[] default '{}';

-- ========================================
-- Phase 9 migrations — combined-points (Americano) scoring systems
-- ========================================

-- Extend scoring_system check to include combined_21/32/42 on tournaments.
alter table tournaments drop constraint if exists tournaments_scoring_system_check;
alter table tournaments
  add constraint tournaments_scoring_system_check
  check (scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'combined_21','combined_32','combined_42',
    'sets_best3','sets_supertiebreak'
  ));

-- Same extension for league_seasons.finals_scoring_system.
alter table league_seasons drop constraint if exists league_seasons_finals_scoring_system_check;
alter table league_seasons
  add constraint league_seasons_finals_scoring_system_check
  check (finals_scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'combined_21','combined_32','combined_42',
    'sets_best3','sets_supertiebreak'
  ));

-- divisions.scoring_system had no check constraint previously — add one now.
alter table divisions drop constraint if exists divisions_scoring_system_check;
alter table divisions
  add constraint divisions_scoring_system_check
  check (scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'combined_21','combined_32','combined_42',
    'sets_best3','sets_supertiebreak'
  ));

-- ========================================
-- Phase 10 — Operations module (unified platform merger from padel-ops)
-- ========================================

-- 10.2 — Program library.
-- Type is free-text (not constrained) so the operator can add new categories
-- without a migration. The UI dropdown is seeded with the 12 canonical types
-- from padel-ops: Аренда, Тренировка персональная, Тренировка групповая,
-- Американо, Мексикано, Детская тренировка, Корпоратив, Турнир, Клиника,
-- Сплит-аренда, Абонемент, Прочее.
-- Both peak and off-peak prices are stored (peak window = 17:00–22:00,
-- ported from padel-ops PEAK_START/PEAK_END).
create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  duration_minutes int not null,
  price_peak_rub int not null default 0,
  price_offpeak_rub int not null default 0,
  courts_needed int not null default 1,
  max_players int,
  description text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index idx_programs_type on programs(type);
create index idx_programs_active on programs(is_active);

-- ========================================
-- Phase 10.3 — Coaches module
-- ========================================

-- Coaches profile. Rate model is split: 'flat' coaches earn a fixed amount per
-- session; 'percent' coaches earn rate_court_percent of the court revenue plus
-- rate_coaching_percent of the coaching fee (the two slices that programs.txt
-- splits a session revenue into, see schedule_sessions below).
-- photo_url stores an external URL — actual upload UI is out of scope here.
create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  specialization text,
  level text,                            -- e.g. "старший", "стажёр"
  bio text,
  photo_url text,
  color text not null default '#4fc3f7', -- accent on cards / scheduler blocks
  rate_type text not null check (rate_type in ('flat','percent')) default 'flat',
  flat_rate_rub int not null default 0,
  rate_court_percent numeric(5,2) not null default 0,
  rate_coaching_percent numeric(5,2) not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz default now()
);
create index idx_coaches_active on coaches(is_active);

-- Weekly availability windows. Multiple rows per (coach, day) allowed
-- (e.g. 09:00-12:00 and 17:00-21:00 on Monday).
create table coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),  -- 0=Mon
  start_time time not null,
  end_time time not null,
  unique(coach_id, day_of_week, start_time)
);
create index idx_coach_availability_coach on coach_availability(coach_id);

-- Schedule sessions (the central operational session table).
-- Created early in 10.3 to back the coach session log; 10.5 will add the
-- weekly scheduler UI that writes to the same table.
-- Revenue split is snapshotted at create time so historical payouts stay
-- correct even if program prices later change:
--   revenue_rub        = total session revenue (typically price × max_players)
--   court_revenue_rub  = court rental portion (price × courts_needed)
--   coaching_fee_rub   = revenue_rub - court_revenue_rub
-- is_peak is also snapshotted (peak window from program-groups.ts: 17:00-22:00).
create table schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id),  -- nullable: free-form sessions OK
  date date not null,
  start_time time not null,
  end_time time not null,
  court_ids uuid[] not null default '{}',
  attendee_count int not null default 0,
  revenue_rub int not null default 0,
  court_revenue_rub int not null default 0,
  coaching_fee_rub int not null default 0,
  is_peak boolean not null default false,
  notes text,
  source text not null default 'manual',     -- manual | scheduler | migration
  status text not null check (status in ('scheduled','completed','cancelled')) default 'scheduled',
  created_at timestamptz default now()
);
create index idx_schedule_sessions_date on schedule_sessions(date);
create index idx_schedule_sessions_courts on schedule_sessions using gin(court_ids);
create index idx_schedule_sessions_status on schedule_sessions(status);

-- Many-to-many: which coaches worked which session.
create table session_coaches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references schedule_sessions(id) on delete cascade,
  coach_id uuid not null references coaches(id) on delete cascade,
  unique(session_id, coach_id)
);
create index idx_session_coaches_session on session_coaches(session_id);
create index idx_session_coaches_coach on session_coaches(coach_id);

-- ── Phase 10.4: Tournament organizer accounts ─────────────────────────────
-- Operators record per-organizer ledgers: charges for court rental/event hosting,
-- deposits received, and any refunds issued.
--
-- Balance convention: positive balance = organizer owes the club.
--   balance = SUM(payment) − SUM(deposit) − SUM(refund)
create table organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

create table organizer_payments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references organizers(id) on delete cascade,
  date date not null,
  amount_rub int not null,
  type text not null check (type in ('deposit','payment','refund')) default 'payment',
  courts_booked int,
  hours_booked numeric(4,1),
  notes text,
  created_at timestamptz default now()
);
create index idx_organizer_payments_org on organizer_payments(organizer_id);
create index idx_organizer_payments_date on organizer_payments(date desc);
