export const GRID_START_MIN = 7 * 60;
export const GRID_END_MIN = 23 * 60;
export const ROW_MIN = 30;
export const TOTAL_ROWS = (GRID_END_MIN - GRID_START_MIN) / ROW_MIN;

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)/;

export function minutesFromHHMM(s: string): number {
  const match = HHMM_RE.exec(s);
  if (!match) return GRID_START_MIN;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function eventRowStart(startTime: string): number {
  const mins = minutesFromHHMM(startTime);
  const offset = mins - GRID_START_MIN;
  const row = Math.round(offset / ROW_MIN);
  if (row < 0) return 0;
  if (row >= TOTAL_ROWS) return TOTAL_ROWS - 1;
  return row;
}

export function eventRowSpan(durationHours: number, rowStart: number): number {
  const raw = Math.max(1, Math.round(durationHours * 2));
  return Math.min(raw, TOTAL_ROWS - rowStart);
}

export function topPct(rowStart: number): number {
  return (rowStart / TOTAL_ROWS) * 100;
}

export function heightPct(rowSpan: number): number {
  return (rowSpan / TOTAL_ROWS) * 100;
}

export function partitionTimed<T extends { startTime: string | null }>(
  events: T[],
): { timed: Array<T & { startTime: string }>; untimed: T[] } {
  const timed: Array<T & { startTime: string }> = [];
  const untimed: T[] = [];
  for (const e of events) {
    if (e.startTime) timed.push(e as T & { startTime: string });
    else untimed.push(e);
  }
  return { timed, untimed };
}

export function formatTimeRange(
  startTime: string,
  durationHours: number,
): string {
  const startMin = minutesFromHHMM(startTime);
  const endMin = startMin + Math.round(durationHours * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`;
  const endHours = Math.floor(endMin / 60) % 24;
  const endStr = `${pad(endHours)}:${pad(endMin % 60)}`;
  return `${startStr}–${endStr}`;
}

export interface LaneAssignment {
  laneIndex: number;
  laneCount: number;
}

// Greedy lane packing: events in the same overlap cluster share a laneCount.
// Each event gets a laneIndex within that cluster. Input order is preserved in the output.
export function assignLanes<T extends { rowStart: number; rowSpan: number }>(
  events: T[],
): LaneAssignment[] {
  const out: LaneAssignment[] = events.map(() => ({
    laneIndex: 0,
    laneCount: 1,
  }));
  if (events.length === 0) return out;

  const order = events
    .map((e, i) => ({ i, start: e.rowStart, end: e.rowStart + e.rowSpan }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let clusterEnd = -Infinity;
  let clusterStart = 0;
  let laneEnds: number[] = [];

  const flush = (upTo: number) => {
    const count = laneEnds.length || 1;
    for (let k = clusterStart; k < upTo; k++) {
      out[order[k].i].laneCount = count;
    }
    laneEnds = [];
  };

  for (let k = 0; k < order.length; k++) {
    const { i, start, end } = order[k];
    if (start >= clusterEnd) {
      flush(k);
      clusterStart = k;
    }
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] > start) lane++;
    laneEnds[lane] = end;
    out[i].laneIndex = lane;
    if (end > clusterEnd) clusterEnd = end;
  }
  flush(order.length);
  return out;
}
