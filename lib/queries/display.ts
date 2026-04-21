import { createClient } from "../supabase/server";
import { computeLiveLeaderboard, sortStrategyForFormat } from "../leaderboard";
import type {
  DivisionCategory,
  DivisionStatus,
  Match,
  Player,
  ScoringSystem,
  SessionStatus,
  TournamentFormat,
  TournamentStatus,
  TournamentType,
} from "../types";

export type DisplayEventStatus = "upcoming" | "in_progress" | "completed";

export interface DisplayLeaderboardEntry {
  playerId: string;
  name: string;
  points: number;
}

export interface DisplayPlayer {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface DisplayEvent {
  key: string;
  tournamentId: string;
  sessionId: string | null;
  divisionId?: string | null;
  category?: DivisionCategory | null;
  name: string;
  format: TournamentFormat;
  type: TournamentType;
  status: DisplayEventStatus;
  startTime: string | null;
  courtNumbers: number[];
  registeredPlayers: DisplayPlayer[];
  maxPlayers: number | null;
  playerCount: number;
  leaderboard: DisplayLeaderboardEntry[];
  winner: { name: string } | null;
}

export interface TickerEvent {
  key: string;
  name: string;
  format: TournamentFormat;
  date: string;
  startTime: string | null;
  courtNumbers: number[];
}

type TournamentRow = {
  id: string;
  name: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  date_start: string;
  start_time: string | null;
  court_ids: string[] | null;
  max_players: number | null;
  scoring_system: ScoringSystem;
};

type SessionRow = {
  id: string;
  tournament_id: string;
  session_date: string;
  session_number: number;
  status: SessionStatus;
  start_time: string | null;
  tournaments: TournamentRow | null;
};

type RegistrationRow = {
  tournament_id: string;
  division_id: string | null;
  player: { id: string; name: string; photo_url: string | null } | null;
};

type DivisionRow = {
  id: string;
  tournament_id: string;
  name: string;
  category: DivisionCategory;
  status: DivisionStatus;
  format: TournamentFormat;
  scoring_system: ScoringSystem;
  court_ids: string[] | null;
  max_players: number | null;
};

type CourtRow = {
  id: string;
  number: number;
};

function uniqueCourtNumbers(
  courtIds: string[] | null | undefined,
  courtNumById: Map<string, number>,
): number[] {
  if (!courtIds || courtIds.length === 0) return [];
  const nums: number[] = [];
  for (const id of courtIds) {
    const n = courtNumById.get(id);
    if (typeof n === "number" && !nums.includes(n)) nums.push(n);
  }
  nums.sort((a, b) => a - b);
  return nums;
}

async function fetchCourtNumberMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("courts")
    .select("id, number")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return new Map<string, number>(
    ((data ?? []) as CourtRow[]).map((c) => [c.id, c.number]),
  );
}

export async function listTodayDisplayEvents(
  todayIso: string,
): Promise<DisplayEvent[]> {
  const supabase = await createClient();

  const [sessionsRes, pendingRes] = await Promise.all([
    supabase
      .from("tournament_sessions")
      .select(
        `id, tournament_id, session_date, session_number, status, start_time,
         tournaments ( id, name, type, format, status, date_start, start_time,
                       court_ids, max_players, scoring_system )`,
      )
      .eq("session_date", todayIso),
    supabase
      .from("tournaments")
      .select(
        `id, name, type, format, status, date_start, start_time, court_ids,
         max_players, scoring_system,
         tournament_sessions ( id )`,
      )
      .eq("date_start", todayIso)
      .eq("type", "one_day"),
  ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (pendingRes.error) throw new Error(pendingRes.error.message);

  const sessionRows = (sessionsRes.data ?? []) as unknown as SessionRow[];
  const pendingRows = (pendingRes.data ?? []) as unknown as Array<
    TournamentRow & { tournament_sessions: Array<{ id: string }> }
  >;

  const tournamentIds = new Set<string>();
  const courtIds = new Set<string>();
  const sessionIds: string[] = [];

  for (const s of sessionRows) {
    tournamentIds.add(s.tournament_id);
    sessionIds.push(s.id);
    for (const cid of s.tournaments?.court_ids ?? []) courtIds.add(cid);
  }
  for (const t of pendingRows) {
    if (t.tournament_sessions && t.tournament_sessions.length > 0) continue;
    tournamentIds.add(t.id);
    for (const cid of t.court_ids ?? []) courtIds.add(cid);
  }

  if (tournamentIds.size === 0) return [];

  const divisionsRes = await supabase
    .from("divisions")
    .select(
      "id, tournament_id, name, category, status, format, scoring_system, court_ids, max_players",
    )
    .in("tournament_id", Array.from(tournamentIds));
  if (divisionsRes.error) throw new Error(divisionsRes.error.message);
  const divisionRows = (divisionsRes.data ?? []) as DivisionRow[];
  for (const d of divisionRows) {
    for (const cid of d.court_ids ?? []) courtIds.add(cid);
  }
  const divisionsByTournament = new Map<string, DivisionRow[]>();
  for (const d of divisionRows) {
    const arr = divisionsByTournament.get(d.tournament_id) ?? [];
    arr.push(d);
    divisionsByTournament.set(d.tournament_id, arr);
  }

  const [registrationsRes, courtNumById, matchesForSessions, players] =
    await Promise.all([
      supabase
        .from("tournament_registrations")
        .select(
          "tournament_id, division_id, player:player_id(id, name, photo_url)",
        )
        .in("tournament_id", Array.from(tournamentIds))
        .neq("status", "cancelled"),
      fetchCourtNumberMap(supabase, Array.from(courtIds)),
      fetchMatchesBySessions(supabase, sessionIds),
      fetchPlayersInTournaments(supabase, Array.from(tournamentIds)),
    ]);

  if (registrationsRes.error) throw new Error(registrationsRes.error.message);

  const regByTournament = new Map<string, DisplayPlayer[]>();
  const regByDivision = new Map<string, DisplayPlayer[]>();
  const seenByTournament = new Map<string, Set<string>>();
  for (const row of (registrationsRes.data ?? []) as unknown as RegistrationRow[]) {
    if (!row.player) continue;
    const summary = {
      id: row.player.id,
      name: row.player.name,
      photo_url: row.player.photo_url,
    };
    if (row.division_id) {
      const list = regByDivision.get(row.division_id) ?? [];
      list.push(summary);
      regByDivision.set(row.division_id, list);
    }
    const seen = seenByTournament.get(row.tournament_id) ?? new Set<string>();
    if (!seen.has(row.player.id)) {
      seen.add(row.player.id);
      seenByTournament.set(row.tournament_id, seen);
      const list = regByTournament.get(row.tournament_id) ?? [];
      list.push(summary);
      regByTournament.set(row.tournament_id, list);
    }
  }

  const events: DisplayEvent[] = [];

  for (const s of sessionRows) {
    const t = s.tournaments;
    if (!t) continue;
    const tournamentDivisions = divisionsByTournament.get(s.tournament_id) ?? [];
    const tournamentMatches = matchesForSessions.get(s.id) ?? [];

    if (tournamentDivisions.length > 0) {
      for (const d of tournamentDivisions) {
        const status = deriveDivisionStatus(d.status);
        const registered = regByDivision.get(d.id) ?? [];
        const divisionMatches = tournamentMatches.filter(
          (m) => m.division_id === d.id,
        );
        const { leaderboard, winner } = computeBoardForEvent({
          matches: divisionMatches,
          players,
          registered,
          format: d.format,
          scoring: d.scoring_system,
          status,
        });
        events.push({
          key: `d:${d.id}`,
          tournamentId: t.id,
          sessionId: s.id,
          divisionId: d.id,
          category: d.category,
          name: `${t.name} · ${d.name}`,
          format: d.format,
          type: t.type,
          status,
          startTime: s.start_time ?? t.start_time ?? null,
          courtNumbers: uniqueCourtNumbers(d.court_ids, courtNumById),
          registeredPlayers: registered,
          maxPlayers: d.max_players,
          playerCount: registered.length,
          leaderboard,
          winner,
        });
      }
      continue;
    }

    const status = deriveStatus(t.status, s.status);
    const courtNumbers = uniqueCourtNumbers(t.court_ids, courtNumById);
    const registered = regByTournament.get(s.tournament_id) ?? [];
    const { leaderboard, winner } = computeBoardForEvent({
      matches: tournamentMatches,
      players,
      registered,
      format: t.format,
      scoring: t.scoring_system,
      status,
    });

    events.push({
      key: `s:${s.id}`,
      tournamentId: t.id,
      sessionId: s.id,
      name: t.name,
      format: t.format,
      type: t.type,
      status,
      startTime: s.start_time ?? t.start_time ?? null,
      courtNumbers,
      registeredPlayers: registered,
      maxPlayers: t.max_players,
      playerCount: registered.length,
      leaderboard,
      winner,
    });
  }

  for (const t of pendingRows) {
    if (t.tournament_sessions && t.tournament_sessions.length > 0) continue;
    const tournamentDivisions = divisionsByTournament.get(t.id) ?? [];

    if (tournamentDivisions.length > 0) {
      for (const d of tournamentDivisions) {
        const status = deriveDivisionStatus(d.status);
        const registered = regByDivision.get(d.id) ?? [];
        events.push({
          key: `d:${d.id}`,
          tournamentId: t.id,
          sessionId: null,
          divisionId: d.id,
          category: d.category,
          name: `${t.name} · ${d.name}`,
          format: d.format,
          type: t.type,
          status,
          startTime: t.start_time ?? null,
          courtNumbers: uniqueCourtNumbers(d.court_ids, courtNumById),
          registeredPlayers: registered,
          maxPlayers: d.max_players,
          playerCount: registered.length,
          leaderboard: [],
          winner: null,
        });
      }
      continue;
    }

    const status: DisplayEventStatus =
      t.status === "completed" ? "completed" : "upcoming";
    const courtNumbers = uniqueCourtNumbers(t.court_ids, courtNumById);
    const registered = regByTournament.get(t.id) ?? [];
    events.push({
      key: `t:${t.id}`,
      tournamentId: t.id,
      sessionId: null,
      name: t.name,
      format: t.format,
      type: t.type,
      status,
      startTime: t.start_time ?? null,
      courtNumbers,
      registeredPlayers: registered,
      maxPlayers: t.max_players,
      playerCount: registered.length,
      leaderboard: [],
      winner: null,
    });
  }

  events.sort((a, b) => {
    const ta = a.startTime ?? "99:99";
    const tb = b.startTime ?? "99:99";
    if (ta !== tb) return ta.localeCompare(tb);
    return a.name.localeCompare(b.name, "ru");
  });

  return events;
}

function deriveStatus(
  tournamentStatus: TournamentStatus,
  sessionStatus: SessionStatus,
): DisplayEventStatus {
  if (sessionStatus === "completed" || tournamentStatus === "completed")
    return "completed";
  if (sessionStatus === "in_progress") return "in_progress";
  return "upcoming";
}

function deriveDivisionStatus(status: DivisionStatus): DisplayEventStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "upcoming";
}

async function fetchMatchesBySessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionIds: string[],
): Promise<Map<string, Match[]>> {
  const out = new Map<string, Match[]>();
  if (sessionIds.length === 0) return out;
  const { data, error } = await supabase
    .from("matches")
    .select("*, round:round_id!inner(session_id)")
    .in("round.session_id", sessionIds);
  if (error) throw new Error(error.message);

  type Row = Match & { round: { session_id: string } };
  for (const m of (data ?? []) as unknown as Row[]) {
    const sid = m.round?.session_id;
    if (!sid) continue;
    const list = out.get(sid) ?? [];
    list.push({
      id: m.id,
      round_id: m.round_id,
      division_id: m.division_id,
      court_number: m.court_number,
      court_id: m.court_id,
      team1_player1_id: m.team1_player1_id,
      team1_player2_id: m.team1_player2_id,
      team2_player1_id: m.team2_player1_id,
      team2_player2_id: m.team2_player2_id,
      team1_score: m.team1_score,
      team2_score: m.team2_score,
      score_detail: m.score_detail,
      status: m.status,
      created_at: m.created_at,
    });
    out.set(sid, list);
  }
  return out;
}

async function fetchPlayersInTournaments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentIds: string[],
): Promise<Player[]> {
  if (tournamentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("player:player_id(*)")
    .in("tournament_id", tournamentIds)
    .neq("status", "cancelled");
  if (error) throw new Error(error.message);
  const seen = new Map<string, Player>();
  type Row = { player: Player | null };
  for (const row of (data ?? []) as unknown as Row[]) {
    if (row.player && !seen.has(row.player.id)) seen.set(row.player.id, row.player);
  }
  return Array.from(seen.values());
}

function computeBoardForEvent(input: {
  matches: Match[];
  players: Player[];
  registered: DisplayPlayer[];
  format: TournamentFormat;
  scoring: ScoringSystem;
  status: DisplayEventStatus;
}): {
  leaderboard: DisplayLeaderboardEntry[];
  winner: { name: string } | null;
} {
  if (input.status === "upcoming") return { leaderboard: [], winner: null };

  const rows = computeLiveLeaderboard(
    input.matches,
    input.players,
    sortStrategyForFormat(input.format),
    input.scoring,
  );

  const leaderboard = rows.slice(0, 3).map((r) => ({
    playerId: r.playerId,
    name: r.playerName,
    points: r.points,
  }));

  const winner =
    input.status === "completed" && rows.length > 0
      ? { name: rows[0]!.playerName }
      : null;

  return { leaderboard, winner };
}

export async function listUpcomingTickerEvents(
  todayIso: string,
  daysAhead = 7,
): Promise<TickerEvent[]> {
  const end = addDaysIso(todayIso, daysAhead);
  const supabase = await createClient();

  const [sessionsRes, pendingRes] = await Promise.all([
    supabase
      .from("tournament_sessions")
      .select(
        `id, session_date, start_time,
         tournaments ( name, format, court_ids, start_time )`,
      )
      .gt("session_date", todayIso)
      .lte("session_date", end),
    supabase
      .from("tournaments")
      .select(
        `id, name, format, date_start, start_time, court_ids,
         tournament_sessions ( id )`,
      )
      .gt("date_start", todayIso)
      .lte("date_start", end)
      .eq("type", "one_day"),
  ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (pendingRes.error) throw new Error(pendingRes.error.message);

  const courtIds = new Set<string>();

  type SessRow = {
    id: string;
    session_date: string;
    start_time: string | null;
    tournaments: {
      name: string;
      format: TournamentFormat;
      court_ids: string[] | null;
      start_time: string | null;
    } | null;
  };
  type PendRow = {
    id: string;
    name: string;
    format: TournamentFormat;
    date_start: string;
    start_time: string | null;
    court_ids: string[] | null;
    tournament_sessions: Array<{ id: string }>;
  };

  const sRows = (sessionsRes.data ?? []) as unknown as SessRow[];
  const pRows = (pendingRes.data ?? []) as unknown as PendRow[];

  for (const s of sRows) {
    for (const cid of s.tournaments?.court_ids ?? []) courtIds.add(cid);
  }
  for (const t of pRows) {
    if (t.tournament_sessions.length > 0) continue;
    for (const cid of t.court_ids ?? []) courtIds.add(cid);
  }

  const courtNumById = await fetchCourtNumberMap(supabase, Array.from(courtIds));

  const out: TickerEvent[] = [];

  for (const s of sRows) {
    const t = s.tournaments;
    if (!t) continue;
    out.push({
      key: `s:${s.id}`,
      name: t.name,
      format: t.format,
      date: s.session_date,
      startTime: s.start_time ?? t.start_time ?? null,
      courtNumbers: uniqueCourtNumbers(t.court_ids, courtNumById),
    });
  }
  for (const t of pRows) {
    if (t.tournament_sessions.length > 0) continue;
    out.push({
      key: `t:${t.id}`,
      name: t.name,
      format: t.format,
      date: t.date_start,
      startTime: t.start_time ?? null,
      courtNumbers: uniqueCourtNumbers(t.court_ids, courtNumById),
    });
  }

  out.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const ta = a.startTime ?? "99:99";
    const tb = b.startTime ?? "99:99";
    return ta.localeCompare(tb);
  });

  return out;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
