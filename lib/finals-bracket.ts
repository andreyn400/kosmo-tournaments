import {
  type BracketSize,
  matchesInRound,
  roundsForSize,
  seedingOrderForSize,
} from "./finals-seeding";

export interface QualifiedPair {
  pairSeed: number;
  player1_id: string;
  player2_id: string;
}

export interface PlannedMatch {
  tempId: string;
  round_number: number;
  position: number;
  seed1: number | null;
  seed2: number | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  status: "pending" | "bye";
  winner_team: 1 | 2 | null;
  nextTempId: string | null;
  nextTempSlot: 1 | 2 | null;
}

export interface GenerateBracketInput {
  bracketSize: BracketSize;
  qualifiedPairs: QualifiedPair[];
}

const tempKey = (round: number, position: number) => `r${round}_p${position}`;

export function generateBracketPlan(
  input: GenerateBracketInput,
): PlannedMatch[] {
  const { bracketSize, qualifiedPairs } = input;
  const K = qualifiedPairs.length;
  if (K < bracketSize / 2) {
    throw new Error(
      `Слишком мало пар для сетки на ${bracketSize}: нужно минимум ${bracketSize / 2}, найдено ${K}`,
    );
  }
  if (K > bracketSize) {
    throw new Error(
      `Слишком много пар (${K}) для сетки на ${bracketSize}. Уменьшите список или увеличьте размер сетки.`,
    );
  }

  const pairBySeed = new Map<number, QualifiedPair>();
  for (const p of qualifiedPairs) pairBySeed.set(p.pairSeed, p);

  const order = seedingOrderForSize(bracketSize);
  const totalRounds = roundsForSize(bracketSize);

  const matches: PlannedMatch[] = [];
  const byKey = new Map<string, PlannedMatch>();

  for (let r = 1; r <= totalRounds; r++) {
    const count = matchesInRound(bracketSize, r);
    for (let p = 0; p < count; p++) {
      const m: PlannedMatch = {
        tempId: tempKey(r, p),
        round_number: r,
        position: p,
        seed1: null,
        seed2: null,
        team1_player1_id: null,
        team1_player2_id: null,
        team2_player1_id: null,
        team2_player2_id: null,
        status: "pending",
        winner_team: null,
        nextTempId: r === totalRounds ? null : tempKey(r + 1, Math.floor(p / 2)),
        nextTempSlot: r === totalRounds ? null : p % 2 === 0 ? 1 : 2,
      };
      matches.push(m);
      byKey.set(m.tempId, m);
    }
  }

  for (let p = 0; p < matchesInRound(bracketSize, 1); p++) {
    const s1 = order[2 * p];
    const s2 = order[2 * p + 1];
    const pair1 = pairBySeed.get(s1) ?? null;
    const pair2 = pairBySeed.get(s2) ?? null;
    const m = byKey.get(tempKey(1, p));
    if (!m) continue;
    m.seed1 = s1;
    m.seed2 = s2;
    if (pair1) {
      m.team1_player1_id = pair1.player1_id;
      m.team1_player2_id = pair1.player2_id;
    }
    if (pair2) {
      m.team2_player1_id = pair2.player1_id;
      m.team2_player2_id = pair2.player2_id;
    }

    const t1Empty = pair1 === null;
    const t2Empty = pair2 === null;
    if (t1Empty && t2Empty) {
      throw new Error(
        `Матч раунда 1 на позиции ${p} получил двух пустых участников (${s1} и ${s2}). Уменьшите размер сетки.`,
      );
    }
    if (t1Empty !== t2Empty) {
      m.status = "bye";
      m.winner_team = t1Empty ? 2 : 1;
      if (m.nextTempId && m.nextTempSlot) {
        const winnerPair = t1Empty ? pair2 : pair1;
        propagateWinner(byKey, m.nextTempId, m.nextTempSlot, winnerPair!);
      }
    }
  }

  for (let r = 2; r <= totalRounds; r++) {
    const count = matchesInRound(bracketSize, r);
    for (let p = 0; p < count; p++) {
      const m = byKey.get(tempKey(r, p));
      if (!m) continue;
      const t1Present = m.team1_player1_id !== null;
      const t2Present = m.team2_player1_id !== null;
      if (t1Present && t2Present) continue;
      if (!t1Present && !t2Present) continue;

      const feed1Key = tempKey(r - 1, 2 * p);
      const feed2Key = tempKey(r - 1, 2 * p + 1);
      const feed1 = byKey.get(feed1Key);
      const feed2 = byKey.get(feed2Key);
      const feedByeOnOther = !t1Present
        ? feed1?.status === "bye"
        : feed2?.status === "bye";
      const otherFeedPending = !t1Present
        ? feed1?.status === "pending"
        : feed2?.status === "pending";
      if (feedByeOnOther) continue;
      if (otherFeedPending) continue;

      m.status = "bye";
      m.winner_team = t1Present ? 1 : 2;
      if (m.nextTempId && m.nextTempSlot) {
        const winnerPair: QualifiedPair = t1Present
          ? {
              pairSeed: 0,
              player1_id: m.team1_player1_id!,
              player2_id: m.team1_player2_id!,
            }
          : {
              pairSeed: 0,
              player1_id: m.team2_player1_id!,
              player2_id: m.team2_player2_id!,
            };
        propagateWinner(byKey, m.nextTempId, m.nextTempSlot, winnerPair);
      }
    }
  }

  return matches;
}

function propagateWinner(
  byKey: Map<string, PlannedMatch>,
  nextTempId: string,
  slot: 1 | 2,
  pair: QualifiedPair,
): void {
  const next = byKey.get(nextTempId);
  if (!next) return;
  if (slot === 1) {
    next.team1_player1_id = pair.player1_id;
    next.team1_player2_id = pair.player2_id;
  } else {
    next.team2_player1_id = pair.player1_id;
    next.team2_player2_id = pair.player2_id;
  }
}

// Sanity:
//   generateBracketPlan({bracketSize:4, qualifiedPairs:[s1,s2,s3,s4]}) →
//     R1: M0 (seed1 vs seed4), M1 (seed2 vs seed3); R2: F (empty, awaits winners).
//   generateBracketPlan({bracketSize:8, qualifiedPairs: 6 pairs seeds 1..6}) →
//     BYEs for seeds 1,2 (vs missing 8,7); M1 (4v5), M3 (3v6) regular.
//     R2 (semis): M0 has seed1 prefilled vs winner(M1), M1 has seed2 prefilled vs winner(M3).
