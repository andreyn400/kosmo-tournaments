// Display helpers shared by the panel and child cards.
// Lang-aware versions live in `lib/i18n/format.ts` — this file keeps a small
// `perPlayer` helper that wraps `formatRub` to compose "per-player" values.

import { formatRub } from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n/types";

export function perPlayer(
  total: number,
  players: number | null,
  lang: Lang,
): string | null {
  if (!players || players <= 0) return null;
  return formatRub(Math.round(total / players), lang);
}
