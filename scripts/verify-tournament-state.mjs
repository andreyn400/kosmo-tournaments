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

const tid = "bdcefbe6-3a9c-436f-8819-835ba85c7672";

const { data: t } = await supabase
  .from("tournaments")
  .select("*")
  .eq("id", tid)
  .single();
console.log(`Tournament status: ${t.status}`);

const { data: s } = await supabase
  .from("tournament_sessions")
  .select("*")
  .eq("tournament_id", tid);
console.log(`Sessions: ${s.map((x) => x.status).join(", ")}`);

const { data: rounds } = await supabase
  .from("rounds")
  .select("*")
  .eq("session_id", s[0].id)
  .order("round_number");
console.log(
  `Rounds: ${rounds.map((r) => `R${r.round_number}:${r.status}`).join(" ")}`,
);

const { count: matchCount } = await supabase
  .from("matches")
  .select("*", { count: "exact", head: true })
  .in(
    "round_id",
    rounds.map((r) => r.id),
  )
  .eq("status", "completed");
console.log(`Completed matches: ${matchCount}`);

const { data: history } = await supabase
  .from("rating_history")
  .select("*")
  .eq("tournament_id", tid);
console.log(`Rating history rows: ${history.length}`);

const uniquePlayers = new Set(history.map((h) => h.player_id));
console.log(`Unique players in history: ${uniquePlayers.size}`);

const { data: players } = await supabase
  .from("players")
  .select("name, elo_rating, level")
  .in("id", [...uniquePlayers])
  .order("elo_rating", { ascending: false });
console.log(`\nPlayer state after finalize:`);
for (const p of players) {
  console.log(`  ${p.name.padEnd(20)} elo=${p.elo_rating} level=${p.level}`);
}
