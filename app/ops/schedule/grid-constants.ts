/**
 * Pixel geometry for the scheduler grid. Centralised so a single edit
 * resizes everything coherently (header height, row math, current-time line,
 * session-block positioning).
 */
export const ROW_HEIGHT = 32;
export const HEADER_HEIGHT = 40;
export const TIME_GUTTER_WIDTH = 64;
/**
 * Court column width in *scroll* mode — the fallback when the viewport is too
 * narrow to give every court its minimum readable width. In *fluid* mode the
 * actual width is computed as `(containerWidth − TIME_GUTTER_WIDTH) / courts`
 * and threaded through as state.
 */
export const COURT_COL_WIDTH = 160;
/** Below this per-court width the grid drops out of fluid mode into scroll. */
export const MIN_COURT_COL_WIDTH = 140;

/** A session block leaves a 1 px gap at its bottom so adjacent blocks read as
 *  separate events. Sessions of duration < 1 slot would be unreadable, so we
 *  floor the minimum render height at 24 px regardless of slotSpan. */
export const BLOCK_BOTTOM_GAP = 1;
export const MIN_BLOCK_HEIGHT = 24;
