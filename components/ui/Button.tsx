import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(91,94,244,0.20)] disabled:bg-accent-soft disabled:text-fade disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-secondary border border-border hover:bg-subtle hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-accent hover:bg-accent-soft disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-[#b91c1c] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed",
  dark:
    "bg-black text-white hover:bg-[#0b111f] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    className = "",
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-button)] transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});
