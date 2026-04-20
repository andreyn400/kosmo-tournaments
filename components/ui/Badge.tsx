import { type HTMLAttributes } from "react";

type Tone =
  | "format"
  | "level"
  | "status-draft"
  | "status-registration"
  | "status-progress"
  | "status-completed"
  | "qualified"
  | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
  format:
    "bg-subtle text-secondary border border-border rounded-md tracking-wider",
  level: "bg-subtle text-black border border-border rounded-md font-semibold",
  "status-draft":
    "bg-subtle text-muted border border-border rounded-md",
  "status-registration":
    "bg-info-soft text-info border border-info/20 rounded-md",
  "status-progress":
    "bg-warning-soft text-warning border border-warning/20 rounded-md",
  "status-completed":
    "bg-success-soft text-success border border-success/20 rounded-md",
  qualified:
    "bg-accent-soft text-accent border border-accent/20 rounded-md",
  neutral: "bg-subtle text-muted border border-border rounded-md",
};

export function Badge({ tone = "neutral", className = "", ...rest }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex w-fit items-center justify-center px-2 h-6 text-[10.5px] font-semibold whitespace-nowrap uppercase tracking-[0.05em]",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
