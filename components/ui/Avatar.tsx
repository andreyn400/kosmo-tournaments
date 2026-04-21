const AVATAR_PALETTE = [
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

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: AvatarSize;
};

export function Avatar({ name, photoUrl, size = "md" }: AvatarProps) {
  const dim = SIZE_CLASS[size];
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        title={name}
        className={`inline-block rounded-full object-cover ring-2 ring-surface bg-subtle ${dim}`}
      />
    );
  }
  const bg = AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ring-2 ring-surface ${dim}`}
      style={{ backgroundColor: bg }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

type OverflowPillProps = {
  count: number;
  size?: AvatarSize;
};

export function OverflowPill({ count, size = "md" }: OverflowPillProps) {
  const dim = SIZE_CLASS[size];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-subtle text-secondary font-bold ring-2 ring-surface border border-border ${dim}`}
    >
      +{count}
    </span>
  );
}
