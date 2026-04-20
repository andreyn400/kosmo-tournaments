import type { Pair } from "./algorithms/teamAmericano";

export function pairsFromRegistrations(
  registrations: ReadonlyArray<{
    player_id: string;
    partner_id: string | null;
  }>,
): Pair[] {
  const seen = new Set<string>();
  const pairs: Pair[] = [];
  for (const r of registrations) {
    if (!r.partner_id) continue;
    if (seen.has(r.player_id)) continue;
    pairs.push([r.player_id, r.partner_id]);
    seen.add(r.player_id);
    seen.add(r.partner_id);
  }
  return pairs;
}
