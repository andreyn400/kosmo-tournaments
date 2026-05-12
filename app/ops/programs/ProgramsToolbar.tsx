"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ALL_PROGRAM_TYPES } from "@/lib/program-groups";
import type { ViewMode } from "./view-mode";

interface ProgramsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  view: ViewMode;
  onViewChange: (next: ViewMode) => void;
  total: number;
  visible: number;
}

export function ProgramsToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  showInactive,
  onShowInactiveChange,
  view,
  onViewChange,
  total,
  visible,
}: ProgramsToolbarProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,14rem)_auto]">
        <Input
          placeholder="Поиск по названию, типу, коду…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Поиск программ"
        />
        <Select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          aria-label="Фильтр по типу"
        >
          <option value="">Все типы</option>
          {ALL_PROGRAM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <label className="inline-flex items-center gap-2 px-3 h-11 rounded-[var(--radius-button)] border border-border bg-subtle text-sm text-secondary cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onShowInactiveChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Показать неактивные
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="tabular-nums">
          Видно {visible} из {total}
        </span>
        <div
          role="tablist"
          aria-label="Вид"
          className="ml-auto inline-flex p-0.5 rounded-md bg-subtle border border-border"
        >
          <ViewPill
            active={view === "table"}
            onClick={() => onViewChange("table")}
            icon="☰"
            label="Таблица"
          />
          <ViewPill
            active={view === "cards"}
            onClick={() => onViewChange("cards")}
            icon="⊞"
            label="Карточки"
          />
        </div>
      </div>
    </div>
  );
}

function ViewPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[11px] font-semibold transition-colors",
        active
          ? "bg-surface text-black shadow-sm"
          : "text-muted hover:text-black",
      ].join(" ")}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
