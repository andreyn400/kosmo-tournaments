"use client";

import { useTranslation } from "@/components/i18n/useTranslation";

export type ConnectionState = "connecting" | "connected" | "disconnected";

export function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const { t } = useTranslation();
  if (state === "connected") return null;

  const label =
    state === "connecting"
      ? t("play.connection.connecting")
      : t("play.connection.disconnected");
  const tone =
    state === "connecting"
      ? "bg-subtle text-muted border-border"
      : "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "connecting"
            ? "bg-muted"
            : "bg-[var(--color-warning)]"
        } ${state === "disconnected" ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
}
