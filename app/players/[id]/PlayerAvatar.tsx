import type { Player } from "@/lib/types";

const PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function PlayerAvatar({ player }: { player: Player }) {
  if (player.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.photo_url}
        alt={player.name}
        className="h-20 w-20 rounded-full object-cover border border-border bg-subtle"
      />
    );
  }
  const bg = PALETTE[hashString(player.name) % PALETTE.length];
  return (
    <span
      className="inline-flex h-20 w-20 items-center justify-center rounded-full font-bold text-white text-2xl border border-border"
      style={{ backgroundColor: bg }}
      aria-label={player.name}
    >
      {initials(player.name)}
    </span>
  );
}
