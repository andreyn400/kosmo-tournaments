import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}
function newRating(current, actual, expected, k) {
  return Math.round(current + k * (actual - expected));
}
function kFactorForSize(n) {
  if (n >= 16) return 32;
  if (n >= 12) return 24;
  if (n >= 8) return 16;
  return 8;
}
function eloToLevel(elo) {
  if (elo < 1100) return "D";
  if (elo < 1200) return "D+";
  if (elo < 1300) return "C-";
  if (elo < 1400) return "C";
  if (elo < 1500) return "C+";
  if (elo < 1600) return "B-";
  if (elo < 1700) return "B";
  if (elo < 1800) return "B+";
  if (elo < 1900) return "A";
  return "OPEN";
}

async function main() {
  const { data: tournaments, error: tErr } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false });
  if (tErr) throw tErr;
  if (!tournaments?.length) {
    console.log("No in_progress tournament found.");
    return;
  }
  const tournament = tournaments[0];
  console.log(`Tournament: ${tournament.name} (${tournament.id})`);

  const { data: sessions, error: sErr } = await supabase
    .from("tournament_sessions")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("session_number", { ascending: false });
  if (sErr) throw sErr;
  console.log(`Sessions found: ${sessions?.length ?? 0}`);
  if (!sessions || sessions.length === 0) {
    console.log(
      "No session. Tournament was marked in_progress but no session exists — investigate startTournament.",
    );
    return;
  }
  const session = sessions[0];

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("session_id", session.id)
    .order("round_number", { ascending: true });
  console.log(
    `Rounds: ${rounds.length} total, statuses: ${rounds.map((r) => r.status).join(", ")}`,
  );

  for (const round of rounds) {
    if (round.status === "completed") {
      console.log(`Round ${round.round_number}: already completed, skipping`);
      continue;
    }

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("round_id", round.id)
      .order("court_number", { ascending: true });

    if (round.status === "pending") {
      await supabase
        .from("rounds")
        .update({ status: "in_progress" })
        .eq("id", round.id);
    }

    for (const match of matches) {
      if (match.status === "completed") continue;
      const s1 = Math.floor(Math.random() * 15) + 15;
      const s2 = Math.floor(Math.random() * 15) + 15;
      const { error: mErr } = await supabase
        .from("matches")
        .update({
          team1_score: s1,
          team2_score: s2,
          status: "completed",
        })
        .eq("id", match.id);
      if (mErr) throw mErr;
      console.log(
        `  Round ${round.round_number} court ${match.court_number}: ${s1}–${s2}`,
      );
      await new Promise((r) => setTimeout(r, 150));
    }

    await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", round.id);
    console.log(`Round ${round.round_number}: marked completed`);
  }

  await supabase
    .from("tournament_sessions")
    .update({ status: "completed" })
    .eq("id", session.id);
  console.log("Session marked completed. Running ELO finalization...");

  const { data: allMatches } = await supabase
    .from("matches")
    .select("*")
    .in(
      "round_id",
      rounds.map((r) => r.id),
    )
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const playerIds = new Set();
  for (const m of allMatches) {
    for (const id of [
      m.team1_player1_id,
      m.team1_player2_id,
      m.team2_player1_id,
      m.team2_player2_id,
    ]) {
      if (id) playerIds.add(id);
    }
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .in("id", [...playerIds]);
  const elo = new Map();
  const startElo = new Map();
  const nameById = new Map();
  for (const p of players) {
    elo.set(p.id, p.elo_rating);
    startElo.set(p.id, p.elo_rating);
    nameById.set(p.id, p.name);
  }

  const k = kFactorForSize(playerIds.size);
  const historyRows = [];
  for (const m of allMatches) {
    const t1 = [m.team1_player1_id, m.team1_player2_id];
    const t2 = [m.team2_player1_id, m.team2_player2_id];
    const r1 = (elo.get(t1[0]) + elo.get(t1[1])) / 2;
    const r2 = (elo.get(t2[0]) + elo.get(t2[1])) / 2;
    const e1 = expectedScore(r1, r2);
    const e2 = 1 - e1;
    const a1 =
      m.team1_score > m.team2_score
        ? 1
        : m.team1_score < m.team2_score
          ? 0
          : 0.5;
    const a2 = 1 - a1;
    for (const id of t1) {
      const before = elo.get(id);
      const after = newRating(before, a1, e1, k);
      elo.set(id, after);
      historyRows.push({
        player_id: id,
        tournament_id: tournament.id,
        elo_before: before,
        elo_after: after,
        change: after - before,
      });
    }
    for (const id of t2) {
      const before = elo.get(id);
      const after = newRating(before, a2, e2, k);
      elo.set(id, after);
      historyRows.push({
        player_id: id,
        tournament_id: tournament.id,
        elo_before: before,
        elo_after: after,
        change: after - before,
      });
    }
  }

  const { error: histErr } = await supabase
    .from("rating_history")
    .insert(historyRows);
  if (histErr) throw histErr;

  for (const [id, val] of elo) {
    await supabase
      .from("players")
      .update({ elo_rating: val, level: eloToLevel(val) })
      .eq("id", id);
  }

  await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("id", tournament.id);

  console.log(`\n=== FINAL STANDINGS ===`);
  console.log(`K-factor used: ${k} (${playerIds.size} players)`);
  console.log(`Matches scored: ${allMatches.length}`);
  console.log(`Rating history rows: ${historyRows.length}`);
  console.log(`\nPer-player ELO deltas:`);
  const sorted = [...elo.entries()]
    .map(([id, after]) => ({
      name: nameById.get(id),
      before: startElo.get(id),
      after,
      change: after - startElo.get(id),
    }))
    .sort((a, b) => b.change - a.change);
  for (const row of sorted) {
    const sign = row.change >= 0 ? "+" : "";
    console.log(
      `  ${row.name.padEnd(20)} ${row.before} → ${row.after}  (${sign}${row.change}) · ${eloToLevel(row.after)}`,
    );
  }
  console.log(
    `\nTournament: ${tournament.name} → completed. Visit /tournament/${tournament.id}/results`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
