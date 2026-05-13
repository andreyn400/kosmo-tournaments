/**
 * Per-program-type color tokens for scheduler blocks.
 *
 * Each entry yields three values:
 *  - `block`: the filled background of an occupied scheduler block. Mid-600
 *    tier — saturated enough to be identifiable at small sizes (3-row /
 *    96 px tall blocks for 90-min sessions), restrained enough that a packed
 *    grid doesn't look like a clown's pocket.
 *  - `soft`:  the 50-tier paired tint, used to wash peak rows behind the
 *    block and for hover state on empty cells. Stays legible under black text.
 *  - `ink`:   foreground text color on top of `block`. White everywhere; kept
 *    as a field so a future pastel addition can override to near-black.
 *
 * Groups deliberately share hue families so the palette has structure:
 *   tournaments → rose (premium, urgent)
 *   group play  → blues / fuchsia
 *   coaching    → teal / sky
 *   kids        → cyan
 *   open play   → emerald
 *   rentals     → ambers / oranges / yellow (warm, "external client")
 *
 * `isTournament: true` marks types that get a distinct render treatment
 * (heavier border, trophy glyph) — flagged here, applied in the block renderer.
 */
export interface ProgramTypeColor {
  block: string;
  soft: string;
  ink: string;
  isTournament: boolean;
}

const FALLBACK: ProgramTypeColor = {
  block: "var(--color-accent)",
  soft: "var(--color-accent-soft)",
  ink: "#ffffff",
  isTournament: false,
};

export const PROGRAM_TYPE_COLORS: Record<string, ProgramTypeColor> = {
  // ── Tournaments ───────────────────────────────────────────────────────
  "ТУРНИР": {
    block: "#e11d48",
    soft: "#fff1f2",
    ink: "#ffffff",
    isTournament: true,
  },
  "КОРПОРАТИВНЫЙ ТУРНИР": {
    block: "#9f1239",
    soft: "#ffe4e6",
    ink: "#ffffff",
    isTournament: true,
  },

  // ── Group play ────────────────────────────────────────────────────────
  "РАУНД РОБИН": {
    block: "#7c3aed",
    soft: "#f5f3ff",
    ink: "#ffffff",
    isTournament: false,
  },
  "КОМБО": {
    block: "#2563eb",
    soft: "#eff6ff",
    ink: "#ffffff",
    isTournament: false,
  },
  "КОМБО ПРОГРАММА": {
    block: "#c026d3",
    soft: "#fdf4ff",
    ink: "#ffffff",
    isTournament: false,
  },

  // ── Coaching ──────────────────────────────────────────────────────────
  "КЛИНИКА": {
    block: "#0369a1",
    soft: "#f0f9ff",
    ink: "#ffffff",
    isTournament: false,
  },
  "ИНДИВИДУАЛЬНАЯ ТРЕНИРОВКА": {
    block: "#0d9488",
    soft: "#f0fdfa",
    ink: "#ffffff",
    isTournament: false,
  },

  // ── Kids ──────────────────────────────────────────────────────────────
  "ДЕТСКАЯ ПРОГРАММА": {
    block: "#0891b2",
    soft: "#ecfeff",
    ink: "#ffffff",
    isTournament: false,
  },

  // ── Open / casual ─────────────────────────────────────────────────────
  "ОТКРЫТАЯ ИГРА": {
    block: "#059669",
    soft: "#ecfdf5",
    ink: "#ffffff",
    isTournament: false,
  },

  // ── Rentals (until 10.6 ships a dedicated rental layer, ad-hoc
  //    rental-typed schedule_sessions still render with these) ──────────
  "АРЕНДА КОРТА": {
    block: "#d97706",
    soft: "#fffbeb",
    ink: "#ffffff",
    isTournament: false,
  },
  "КОРПОРАТИВНАЯ АРЕНДА": {
    block: "#c2410c",
    soft: "#ffedd5",
    ink: "#ffffff",
    isTournament: false,
  },
  "АРЕНДА ПРОСТРАНСТВА": {
    block: "#ca8a04",
    soft: "#fefce8",
    ink: "#ffffff",
    isTournament: false,
  },
};

/**
 * Lookup that never returns null. Unknown types fall back to the accent token,
 * so a misconfigured program still renders as a recognisable block.
 */
export function programTypeColor(type: string | null | undefined): ProgramTypeColor {
  if (!type) return FALLBACK;
  return PROGRAM_TYPE_COLORS[type] ?? FALLBACK;
}

/** All defined types in palette order (useful for legends). */
export const PROGRAM_TYPES_IN_ORDER: string[] = Object.keys(PROGRAM_TYPE_COLORS);
