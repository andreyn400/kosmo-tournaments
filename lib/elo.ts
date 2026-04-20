export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function newRating(
  current: number,
  actualScore: number,
  expected: number,
  k: number,
): number {
  return Math.round(current + k * (actualScore - expected));
}

export function kFactorForSize(playerCount: number): number {
  if (playerCount >= 16) return 32;
  if (playerCount >= 12) return 24;
  if (playerCount >= 8) return 16;
  return 8;
}
