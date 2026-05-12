"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  type AppMode,
  MODE_DEFAULT_PATH,
  getModeFromPathname,
} from "./navLinks";

const STORAGE_KEY = "kosmo_mode";

type ModeSwitcherProps = {
  onNavigate?: () => void;
};

export function ModeSwitcher({ onNavigate }: ModeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = getModeFromPathname(pathname);

  // URL is authoritative: keep localStorage in sync so a fresh tab restores the
  // last-visited section if the user lands on a mode-neutral page (none today,
  // but room to grow).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore quota/privacy errors
    }
  }, [mode]);

  function switchTo(next: AppMode) {
    if (next === mode) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    onNavigate?.();
    router.push(MODE_DEFAULT_PATH[next]);
  }

  return (
    <div className="px-3 pt-3">
      <div
        role="tablist"
        aria-label="Режим"
        className="grid grid-cols-2 gap-1 p-1 rounded-md bg-subtle border border-border"
      >
        <Pill
          active={mode === "tournaments"}
          onClick={() => switchTo("tournaments")}
          label="Турниры"
        />
        <Pill
          active={mode === "ops"}
          onClick={() => switchTo("ops")}
          label="Операции"
        />
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "h-8 rounded text-xs font-semibold tracking-wide transition-colors",
        active
          ? "bg-surface text-black shadow-sm"
          : "text-muted hover:text-black",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
