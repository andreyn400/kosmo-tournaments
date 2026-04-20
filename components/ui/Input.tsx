import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseClass =
  "w-full h-11 px-3.5 rounded-[var(--radius-button)] bg-subtle border border-border text-black placeholder:text-fade focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50 disabled:bg-subtle";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...rest },
  ref,
) {
  return <input ref={ref} className={`${baseClass} ${className}`.trim()} {...rest} />;
});
