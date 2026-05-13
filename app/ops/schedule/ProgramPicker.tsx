"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import type { Program } from "@/lib/types";
import { programTypeColor } from "@/lib/program-colors";

interface ProgramPickerProps {
  programs: Program[];
  selectedId: string | null;
  onSelect: (program: Program | null) => void;
}

/**
 * Compact program picker for the session popover: type-chip row + search +
 * scrollable filtered list. Selecting a program calls back with the full
 * `Program` so the popover can prefill duration / courts_needed / max_players
 * in one pass. "Без программы" stays available for ad-hoc bookings that
 * shouldn't be backed by a program (rare, but supported by the schema).
 */
export function ProgramPicker({
  programs,
  selectedId,
  onSelect,
}: ProgramPickerProps) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const p of programs) set.add(p.type);
    return [...set].sort();
  }, [programs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (activeType && p.type !== activeType) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [programs, search, activeType]);

  const selectedProgram = programs.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-1">
        <TypeChip
          label="Все"
          active={activeType === ""}
          color={null}
          onClick={() => setActiveType("")}
        />
        {types.map((t) => (
          <TypeChip
            key={t}
            label={t}
            active={activeType === t}
            color={programTypeColor(t).block}
            onClick={() => setActiveType(t)}
          />
        ))}
      </div>

      <Input
        type="search"
        placeholder="Поиск по названию программы…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="!h-9"
      />

      <div className="rounded-md border border-border bg-subtle/30 max-h-40 overflow-y-auto">
        {/* "Без программы" option — always at the top, useful for rentals/open play */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={[
            "w-full text-left px-2.5 py-1.5 text-xs transition-colors border-b border-border",
            selectedId === null
              ? "bg-accent-soft text-accent font-semibold"
              : "text-secondary hover:bg-subtle",
          ].join(" ")}
        >
          <span className="italic">Без программы</span>
          <span className="text-fade ml-2 text-[10.5px]">
            свободное бронирование / аренда
          </span>
        </button>
        {filtered.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted">
            Ничего не найдено
          </div>
        ) : (
          filtered.slice(0, 40).map((p) => (
            <ProgramRow
              key={p.id}
              program={p}
              active={p.id === selectedId}
              onClick={() => onSelect(p)}
            />
          ))
        )}
      </div>

      {selectedProgram && (
        <div className="text-[10.5px] text-muted tabular-nums px-1">
          {selectedProgram.duration_minutes} мин · {selectedProgram.courts_needed}{" "}
          {selectedProgram.courts_needed === 1 ? "корт" : "корта"} · до{" "}
          {selectedProgram.max_players ?? "—"} игр. · Пик{" "}
          {selectedProgram.price_peak_rub} ₽ · Off-peak{" "}
          {selectedProgram.price_offpeak_rub} ₽
        </div>
      )}
    </div>
  );
}

function TypeChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center px-2 h-6 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors",
        active
          ? "text-white border-transparent"
          : "bg-surface text-secondary border-border hover:border-border-strong",
      ].join(" ")}
      style={active && color ? { background: color } : undefined}
    >
      {label}
    </button>
  );
}

function ProgramRow({
  program,
  active,
  onClick,
}: {
  program: Program;
  active: boolean;
  onClick: () => void;
}) {
  const c = programTypeColor(program.type);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center gap-2 border-b border-border last:border-b-0",
        active
          ? "bg-accent-soft text-accent font-semibold"
          : "text-secondary hover:bg-subtle",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: c.block }}
      />
      <span className="flex-1 min-w-0 truncate">{program.name}</span>
      <span className="text-[10px] text-muted tabular-nums flex-shrink-0">
        {program.duration_minutes}м · {program.max_players ?? "?"}и
      </span>
    </button>
  );
}
