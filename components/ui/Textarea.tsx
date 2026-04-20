import { type TextareaHTMLAttributes, forwardRef } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const baseClass =
  "w-full min-h-24 px-3.5 py-2.5 rounded-[var(--radius-button)] bg-subtle border border-border text-black placeholder:text-fade focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50 disabled:bg-subtle resize-y";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", ...rest },
  ref,
) {
  return <textarea ref={ref} className={`${baseClass} ${className}`.trim()} {...rest} />;
});
