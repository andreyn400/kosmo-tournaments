"use client";

/**
 * Tiny reusable primitives for the SessionPopover form: labelled section,
 * chip row container, toggle chip, and the four-up preview card. Lifted out
 * of SessionPopover.tsx purely to keep that file under the 600-line cap.
 */
export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

export function ToggleChip({
  active,
  onClick,
  label,
  accentColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  /** When provided AND active, the chip uses this color as its background. */
  accentColor?: string;
}) {
  const style: React.CSSProperties = {};
  if (active && accentColor) {
    style.background = accentColor;
    style.borderColor = accentColor;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center px-2.5 h-7 rounded text-[11px] font-semibold border transition-colors",
        active && !accentColor
          ? "bg-accent text-white border-accent"
          : active && accentColor
            ? "text-white"
            : "bg-surface text-secondary border-border hover:border-border-strong",
      ].join(" ")}
      style={style}
    >
      {label}
    </button>
  );
}

export function PreviewCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "muted";
}) {
  const labelCls =
    tone === "warn" ? "text-[var(--color-warning)]" : "text-muted";
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className={`text-[9.5px] font-semibold uppercase tracking-wider truncate ${labelCls}`}
      >
        {label}
      </span>
      <span className="text-black font-semibold tabular-nums text-[12px] truncate">
        {value}
      </span>
    </div>
  );
}
