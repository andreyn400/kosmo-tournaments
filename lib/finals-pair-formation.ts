import type { BracketSize } from "./finals-seeding";

export interface SeededIndividual {
  playerId: string;
  name: string;
  seed: number;
}

export interface FormedPair {
  pairSeed: number;
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
}

export function snakePairsForBracket(
  individuals: SeededIndividual[],
  bracketSize: BracketSize,
): FormedPair[] {
  const needed = bracketSize * 2;
  if (individuals.length < needed) {
    throw new Error(
      `Нужно ${needed} квалифицированных игроков для сетки на ${bracketSize} пар, найдено ${individuals.length}`,
    );
  }
  const sorted = [...individuals].sort((a, b) => a.seed - b.seed);
  const pool = sorted.slice(0, needed);
  const pairs: FormedPair[] = [];
  for (let pairSeed = 1; pairSeed <= bracketSize; pairSeed++) {
    const top = pool[pairSeed - 1];
    const bottom = pool[needed - pairSeed];
    pairs.push({
      pairSeed,
      player1_id: top.playerId,
      player2_id: bottom.playerId,
      player1_name: top.name,
      player2_name: bottom.name,
    });
  }
  return pairs;
}

export function swapPairMembers(
  pairs: FormedPair[],
  aIndex: number,
  bIndex: number,
  side: "top" | "bottom",
): FormedPair[] {
  if (aIndex === bIndex) return pairs;
  const next = pairs.map((p) => ({ ...p }));
  const a = next[aIndex];
  const b = next[bIndex];
  if (side === "top") {
    [a.player1_id, b.player1_id] = [b.player1_id, a.player1_id];
    [a.player1_name, b.player1_name] = [b.player1_name, a.player1_name];
  } else {
    [a.player2_id, b.player2_id] = [b.player2_id, a.player2_id];
    [a.player2_name, b.player2_name] = [b.player2_name, a.player2_name];
  }
  return next;
}

// Sanity checks:
//   snakePairsForBracket(indivs[1..4], 2) → pair1=(1,4), pair2=(2,3)
//   snakePairsForBracket(indivs[1..8], 4) → pair1=(1,8), pair2=(2,7), pair3=(3,6), pair4=(4,5)
//   snakePairsForBracket(indivs[1..16], 8) → pair1=(1,16), ..., pair8=(8,9)
