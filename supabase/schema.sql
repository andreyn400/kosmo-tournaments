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
