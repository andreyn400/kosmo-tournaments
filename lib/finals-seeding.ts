export type BracketSize = 2 | 4 | 8 | 16 | 32;

export const BRACKET_SIZES: readonly BracketSize[] = [2, 4, 8, 16, 32] as const;

export function isBracketSize(n: number): n is BracketSize {
  return (BRACKET_SIZES as readonly number[]).includes(n);
}

export function seedingOrderForSize(size: BracketSize): number[] {
  let order: number[] = [1, 2];
  let current = 2;
  while (current < size) {
    const next = current * 2;
    const expanded: number[] = [];
    for (const s of order) expanded.push(s, next + 1 - s);
    order = expanded;
    current = next;
  }
  return order;
}

export function roundsForSize(size: BracketSize): number {
  return Math.log2(size);
}

export function matchesInRound(size: BracketSize, round: number): number {
  return size / Math.pow(2, round);
}

// Sanity checks (run mentally / in tests):
//   seedingOrderForSize(2)  === [1, 2]
//   seedingOrderForSize(4)  === [1, 4, 2, 3]
//   seedingOrderForSize(8)  === [1, 8, 4, 5, 2, 7, 3, 6]
//   seedingOrderForSize(16) === [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
// Seeds 1 and 2 are always in opposite halves.
// roundsForSize(8) === 3; matchesInRound(8, 1) === 4; matchesInRound(8, 3) === 1.
