import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article";
  padded?: boolean;
  interactive?: boolean;
  accentLeft?: boolean;
};

const shadowMd =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]";
const shadowLgHover =
  "hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.04)]";

export function Card({
  as: Tag = "div",
  padded = true,
  interactive = false,
  accentLeft = false,
  className = "",
  ...rest
}: CardProps) {
  const base = `rounded-[var(--radius-card)] border border-border bg-surface ${shadowMd}`;
  const pad = padded ? "p-6" : "";
  const inter = interactive
    ? `transition-all ${shadowLgHover} hover:border-border-strong cursor-pointer`
    : "";
  const accent = accentLeft
    ? "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-accent before:rounded-l-[var(--radius-card)]"
    : "";
  return (
    <Tag
      className={`${base} ${pad} ${inter} ${accent} ${className}`.trim()}
      {...rest}
    />
  );
}
