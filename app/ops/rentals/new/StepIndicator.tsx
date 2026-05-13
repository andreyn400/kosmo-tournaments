"use client";

interface StepIndicatorProps {
  steps: { key: number; label: string }[];
  current: number;
}

/**
 * Compact horizontal step indicator: numbered dots connected by lines.
 * Past steps fill in accent; current step has an outlined ring; future steps
 * sit muted. Labels under each dot, truncated on narrow viewports.
 */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex items-start gap-0">
      {steps.map((step, i) => {
        const isPast = step.key < current;
        const isCurrent = step.key === current;
        const isLast = i === steps.length - 1;
        return (
          <li
            key={step.key}
            className="flex-1 flex flex-col items-center gap-1.5 relative min-w-0"
          >
            <div className="flex items-center w-full">
              {/* Left connector */}
              <div
                className={`flex-1 h-0.5 ${
                  i === 0
                    ? "bg-transparent"
                    : isPast || isCurrent
                      ? "bg-accent"
                      : "bg-border"
                }`}
              />
              {/* Dot */}
              <div
                className={[
                  "relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold tabular-nums transition-colors",
                  isPast
                    ? "bg-accent text-white"
                    : isCurrent
                      ? "bg-surface text-accent border-2 border-accent"
                      : "bg-subtle text-muted border border-border",
                ].join(" ")}
              >
                {isPast ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.key
                )}
              </div>
              {/* Right connector */}
              <div
                className={`flex-1 h-0.5 ${
                  isLast
                    ? "bg-transparent"
                    : isPast
                      ? "bg-accent"
                      : "bg-border"
                }`}
              />
            </div>
            <span
              className={[
                "text-[10.5px] font-semibold uppercase tracking-wider text-center truncate w-full px-2",
                isCurrent
                  ? "text-accent"
                  : isPast
                    ? "text-secondary"
                    : "text-muted",
              ].join(" ")}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
