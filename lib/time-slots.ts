export function generateTimeSlots(
  startMin: string = "07:00",
  endMin: string = "23:00",
  stepMin: number = 30,
): string[] {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const pad = (n: number) => String(n).padStart(2, "0");

  const start = toMinutes(startMin);
  const end = toMinutes(endMin);
  const slots: string[] = [];
  for (let t = start; t <= end; t += stepMin) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeSlot(value: string): boolean {
  return TIME_RE.test(value);
}

export function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = TIME_RE.exec(trimmed.slice(0, 5));
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}
